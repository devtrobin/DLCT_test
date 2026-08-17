type ProposalRecord = {
  id: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'CONFLICT'
  authorParty: 'CLIENT' | 'PROFESSIONAL'
  recipientParty: 'CLIENT' | 'PROFESSIONAL'
  proposedStartAt: Date
  proposedEndAt: Date
  rejectionReason: string | null
  createdAt: Date
  decidedAt: Date | null
}

export const projectProposal = (proposal: ProposalRecord) => ({
  authorParty: proposal.authorParty,
  createdAt: proposal.createdAt.toISOString(),
  decidedAt: proposal.decidedAt?.toISOString() ?? null,
  id: proposal.id,
  proposedRange: {
    endAt: proposal.proposedEndAt.toISOString(),
    startAt: proposal.proposedStartAt.toISOString(),
  },
  recipientParty: proposal.recipientParty,
  rejectionReason: proposal.rejectionReason,
  status: proposal.status,
})
