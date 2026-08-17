import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { AppointmentRecord } from './appointment-query.service'
import { projectProposal } from './proposal-projector'
import { getProposal } from './proposal-query.service'
import type { AppointmentPrincipal } from '../types/principal.types'

export const closeProposal = async (
  appointment: AppointmentRecord,
  proposalId: number,
  principal: AppointmentPrincipal,
  action: 'REJECTED' | 'CANCELED',
  reason?: string,
) => {
  const proposal = await getProposal(appointment.id, proposalId)
  const requiredParty = action === 'REJECTED'
    ? proposal.recipientParty : proposal.authorParty
  if (requiredParty !== principal.party) {
    throw new AppError(403, 'PROPOSAL_ACTION_FORBIDDEN')
  }
  if (proposal.status === action) return projectProposal(proposal)
  if (proposal.status !== 'PENDING') {
    throw new AppError(409, 'PROPOSAL_NOT_PENDING')
  }
  const eventType = action === 'REJECTED'
    ? 'CHANGE_REJECTED' : 'CHANGE_CANCELED'
  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.appointmentChangeProposal.update({
      data: {
        decidedAt: new Date(),
        rejectionReason: action === 'REJECTED' ? reason : undefined,
        status: action,
      },
      where: { id: proposal.id },
    })
    await transaction.appointmentHistory.create({
      data: {
        actorType: principal.actorType,
        actorUserId: principal.userId,
        appointmentId: appointment.id,
        eventType,
        payload: action === 'REJECTED'
          ? { proposalId, reason: reason ?? null }
          : { cause: 'AUTHOR', proposalId },
      },
    })
    return result
  })
  return projectProposal(updated)
}
