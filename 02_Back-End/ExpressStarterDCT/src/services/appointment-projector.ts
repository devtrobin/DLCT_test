import type { AppointmentRecord } from './appointment-query.service'
import { rangeView } from './time.service'

const proposalView = (proposal: AppointmentRecord['proposals'][number]) => ({
  authorParty: proposal.authorParty,
  createdAt: proposal.createdAt.toISOString(),
  decidedAt: proposal.decidedAt?.toISOString() ?? null,
  id: proposal.id,
  proposedRange: rangeView(proposal.proposedStartAt, proposal.proposedEndAt),
  recipientParty: proposal.recipientParty,
  rejectionReason: proposal.rejectionReason,
  status: proposal.status,
})

export const projectAppointment = (
  appointment: AppointmentRecord,
  includeCode = true,
) => ({
  canceledAt: appointment.canceledAt?.toISOString() ?? null,
  cancellationCause: appointment.cancellationCause,
  cancellationReason: appointment.cancellationReason,
  client: {
    deleted: appointment.clientAnonymized,
    email: appointment.clientEmail,
    firstName: appointment.clientFirstName,
    lastName: appointment.clientLastName,
    phone: appointment.clientPhone,
    userId: appointment.clientUserId,
  },
  createdAt: appointment.createdAt.toISOString(),
  history: appointment.history.map((event) => ({
    actorDeleted: event.actorUserId === null
      && !['PUBLIC_CLIENT', 'SYSTEM'].includes(event.actorType),
    actorType: event.actorType,
    createdAt: event.createdAt.toISOString(),
    eventType: event.eventType,
    id: event.id,
    payload: event.payload,
  })),
  id: appointment.id,
  pendingProposal: appointment.proposals[0]
    ? proposalView(appointment.proposals[0]) : null,
  professional: {
    businessName: appointment.professionalBusinessName,
    deleted: appointment.professionalAnonymized,
    timezone: appointment.professionalTimezone,
    userId: appointment.professionalUserId,
  },
  publicCode: includeCode ? appointment.publicCode : null,
  range: rangeView(appointment.startAt, appointment.endAt),
  status: appointment.status,
  updatedAt: appointment.updatedAt.toISOString(),
})

export const projectAppointmentSummary = (appointment: AppointmentRecord) => ({
  canceledAt: appointment.canceledAt?.toISOString() ?? null,
  cancellationCause: appointment.cancellationCause,
  cancellationReason: appointment.cancellationReason,
  clientDeleted: appointment.clientAnonymized,
  clientDisplayName: [appointment.clientFirstName, appointment.clientLastName]
    .filter(Boolean).join(' ') || null,
  hasPendingProposal: appointment.proposals.length > 0,
  id: appointment.id,
  professionalBusinessName: appointment.professionalBusinessName,
  professionalDeleted: appointment.professionalAnonymized,
  range: rangeView(appointment.startAt, appointment.endAt),
  status: appointment.status,
})
