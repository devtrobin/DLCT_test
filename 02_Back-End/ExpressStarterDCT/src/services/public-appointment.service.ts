import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { appointmentInclude } from './appointment-query.service'
import { projectProposal } from './proposal-projector'
import { rangeView } from './time.service'

export const getPublicAppointmentRecord = async (publicCode: string) => {
  const appointment = await prisma.appointment.findUnique({
    include: appointmentInclude,
    where: { publicCode },
  })
  if (!appointment) {
    throw new AppError(404, 'PUBLIC_APPOINTMENT_NOT_FOUND')
  }
  return appointment
}

export type PublicAppointmentRecord = Awaited<
  ReturnType<typeof getPublicAppointmentRecord>
>

export const projectPublicAppointment = (
  appointment: PublicAppointmentRecord,
) => ({
  canceledAt: appointment.canceledAt?.toISOString() ?? null,
  cancellationCause: appointment.cancellationCause,
  cancellationReason: appointment.cancellationReason,
  createdAt: appointment.createdAt.toISOString(),
  history: appointment.history.map((event) => ({
    actor: event.actorType === 'PROFESSIONAL_USER'
      ? 'PROFESSIONAL'
      : event.actorType === 'SYSTEM' ? 'SYSTEM' : 'CLIENT',
    actorDeleted: false,
    createdAt: event.createdAt.toISOString(),
    eventType: event.eventType,
    id: event.id,
    payload: event.payload,
  })),
  pendingProposal: appointment.proposals[0]
    ? projectProposal(appointment.proposals[0]) : null,
  professional: {
    businessName: appointment.professionalBusinessName,
    timezone: appointment.professionalTimezone,
  },
  range: rangeView(appointment.startAt, appointment.endAt),
  status: appointment.status,
})
