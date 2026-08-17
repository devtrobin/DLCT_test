import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { AppointmentRecord } from './appointment-query.service'
import {
  acceptedView,
  assertAcceptPermission,
  markProposalConflict,
} from './proposal-accept-helper.service'
import { projectProposal } from './proposal-projector'
import { getProposal } from './proposal-query.service'
import { assertSlotAvailable } from './slot-validation.service'
import { writeNotification } from './notification-writer'
import type { AppointmentPrincipal } from '../types/principal.types'

export const acceptProposal = async (
  appointment: AppointmentRecord,
  proposalId: number,
  principal: AppointmentPrincipal,
  force = false,
) => {
  const proposal = await getProposal(appointment.id, proposalId)
  assertAcceptPermission(proposal, principal, force)
  if (proposal.status === 'ACCEPTED') {
    return acceptedView(appointment.id, proposal)
  }
  if (proposal.status === 'CONFLICT') {
    throw new AppError(409, 'PROPOSED_SLOT_UNAVAILABLE', {
      proposal: projectProposal(proposal),
    })
  }
  if (proposal.status !== 'PENDING') {
    throw new AppError(409, 'PROPOSAL_NOT_PENDING')
  }
  try {
    await assertSlotAvailable(
      appointment.professionalUserId!,
      proposal.proposedStartAt,
      appointment.id,
    )
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) {
      await markProposalConflict(appointment.id, proposal.id, principal)
      const conflict = await getProposal(appointment.id, proposal.id)
      throw new AppError(409, 'PROPOSED_SLOT_UNAVAILABLE', {
        proposal: projectProposal(conflict),
      })
    }
    throw error
  }
  await prisma.$transaction(async (transaction) => {
    await transaction.appointment.update({
      data: {
        endAt: proposal.proposedEndAt,
        startAt: proposal.proposedStartAt,
      },
      where: { id: appointment.id },
    })
    await transaction.appointmentChangeProposal.update({
      data: { decidedAt: new Date(), status: 'ACCEPTED' },
      where: { id: proposal.id },
    })
    await transaction.appointmentHistory.create({
      data: {
        actorType: principal.actorType,
        actorUserId: principal.userId,
        appointmentId: appointment.id,
        eventType: force ? 'CHANGE_FORCED' : 'CHANGE_ACCEPTED',
        payload: { proposalId: proposal.id },
      },
    })
    await writeNotification(transaction, {
      appointmentId: appointment.id,
      eventKey: `proposal:${proposal.id}:${force ? 'forced' : 'accepted'}`,
      payload: {
        actor: principal.party,
        newRange: {
          endAt: proposal.proposedEndAt.toISOString(),
          startAt: proposal.proposedStartAt.toISOString(),
        },
        proposalId: proposal.id,
      },
      recipientUserId: force
        ? appointment.clientUserId : proposal.authorUserId,
      type: force ? 'CHANGE_FORCED' : 'CHANGE_ACCEPTED',
    })
    await transaction.professionalProfile.update({
      data: { calendarVersion: { increment: 1 } },
      where: { userId: appointment.professionalUserId! },
    })
  }, { isolationLevel: 'Serializable' })
  return acceptedView(appointment.id, await getProposal(
    appointment.id,
    proposal.id,
  ))
}
