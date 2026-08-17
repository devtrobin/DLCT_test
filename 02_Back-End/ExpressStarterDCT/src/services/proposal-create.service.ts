import { DateTime } from 'luxon'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { AppointmentRecord } from './appointment-query.service'
import { projectProposal } from './proposal-projector'
import { writeNotification } from './notification-writer'
import { assertSlotAvailable } from './slot-validation.service'
import type { AppointmentPrincipal } from '../types/principal.types'

export const createProposal = async (
  appointment: AppointmentRecord,
  principal: AppointmentPrincipal,
  proposedStartAt: Date,
) => {
  if (appointment.status !== 'CONFIRMED' || appointment.startAt <= new Date()) {
    throw new AppError(409, 'APPOINTMENT_NOT_MODIFIABLE')
  }
  if (appointment.startAt.getTime() === proposedStartAt.getTime()) {
    throw new AppError(400, 'PROPOSED_SLOT_UNCHANGED')
  }
  if (appointment.proposals.length) {
    throw new AppError(409, 'PROPOSAL_ALREADY_PENDING', {
      proposalId: appointment.proposals[0].id,
    })
  }
  try {
    await assertSlotAvailable(
      appointment.professionalUserId!,
      proposedStartAt,
      appointment.id,
    )
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) {
      throw new AppError(409, 'PROPOSED_SLOT_UNAVAILABLE')
    }
    throw error
  }
  const proposedEndAt = DateTime.fromJSDate(proposedStartAt)
    .plus({ hours: 1 }).toJSDate()
  const proposal = await prisma.$transaction(async (transaction) => {
    await transaction.professionalProfile.update({
      data: { calendarVersion: { increment: 0 } },
      where: { userId: appointment.professionalUserId! },
    })
    const created = await transaction.appointmentChangeProposal.create({
      data: {
        appointmentId: appointment.id,
        authorParty: principal.party,
        authorUserId: principal.userId,
        proposedEndAt,
        proposedStartAt,
        recipientParty: principal.party === 'CLIENT'
          ? 'PROFESSIONAL' : 'CLIENT',
        recipientUserId: principal.party === 'CLIENT'
          ? appointment.professionalUserId : appointment.clientUserId,
      },
    })
    await transaction.appointmentHistory.create({
      data: {
        actorType: principal.actorType,
        actorUserId: principal.userId,
        appointmentId: appointment.id,
        eventType: 'CHANGE_PROPOSED',
        payload: {
          proposalId: created.id,
          proposedRange: {
            endAt: proposedEndAt.toISOString(),
            startAt: proposedStartAt.toISOString(),
          },
        },
      },
    })
    await writeNotification(transaction, {
      appointmentId: appointment.id,
      eventKey: `proposal:${created.id}:created`,
      payload: {
        actor: principal.party,
        proposalId: created.id,
        proposedRange: {
          endAt: proposedEndAt.toISOString(),
          startAt: proposedStartAt.toISOString(),
        },
      },
      recipientUserId: created.recipientUserId,
      type: 'CHANGE_PROPOSED',
    })
    return created
  }, { isolationLevel: 'Serializable' })
  return projectProposal(proposal)
}
