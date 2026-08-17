import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'

export const getProposal = async (
  appointmentId: number,
  proposalId: number,
) => {
  const proposal = await prisma.appointmentChangeProposal.findFirst({
    where: { appointmentId, id: proposalId },
  })
  if (!proposal) throw new AppError(404, 'PROPOSAL_NOT_FOUND')
  return proposal
}
