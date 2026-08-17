import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { AppointmentPrincipal } from '../types/principal.types'
import { getAppointmentRecord } from './appointment-query.service'
import { projectAppointment } from './appointment-projector'
import { projectProposal } from './proposal-projector'
import { getProposal } from './proposal-query.service'

type Proposal = Awaited<ReturnType<typeof getProposal>>

export const assertAcceptPermission = (
  proposal: Proposal,
  principal: AppointmentPrincipal,
  force: boolean,
) => {
  const allowed = force
    ? principal.party === 'PROFESSIONAL'
      && proposal.authorParty === 'PROFESSIONAL'
      && proposal.recipientParty === 'CLIENT'
    : proposal.recipientParty === principal.party
  if (!allowed) throw new AppError(403, 'PROPOSAL_ACTION_FORBIDDEN')
}

export const acceptedView = async (
  appointmentId: number,
  proposal: Proposal,
) => ({
  appointment: projectAppointment(await getAppointmentRecord(appointmentId)),
  proposal: projectProposal(proposal),
})

export const markProposalConflict = async (
  appointmentId: number,
  proposalId: number,
  principal: AppointmentPrincipal,
) => prisma.$transaction([
  prisma.appointmentChangeProposal.update({
    data: { decidedAt: new Date(), status: 'CONFLICT' },
    where: { id: proposalId },
  }),
  prisma.appointmentHistory.create({
    data: {
      actorType: principal.actorType,
      actorUserId: principal.userId,
      appointmentId,
      eventType: 'CHANGE_CONFLICT',
      payload: { proposalId },
    },
  }),
])
