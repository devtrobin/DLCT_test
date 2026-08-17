import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { getVisibleAppointment } from './appointment-query.service'
import { projectAppointment } from './appointment-projector'

type User = { id: number; role: 'CLIENT' | 'PROFESSIONAL' }

export const cancelAppointment = async (
  appointmentId: number,
  user: User,
  reason?: string,
) => {
  const appointment = await getVisibleAppointment(appointmentId, user)
  if (appointment.status === 'CANCELED') {
    return projectAppointment(appointment)
  }
  if (appointment.startAt <= new Date()) {
    throw new AppError(409, 'APPOINTMENT_NOT_MODIFIABLE', { reason: 'PAST' })
  }
  if (user.role === 'PROFESSIONAL' && !reason) {
    throw new AppError(400, 'CANCELLATION_REASON_REQUIRED')
  }
  const actorType = user.role === 'CLIENT'
    ? 'CLIENT_USER' : 'PROFESSIONAL_USER'
  await prisma.$transaction(async (transaction) => {
    await transaction.appointmentChangeProposal.updateMany({
      data: { decidedAt: new Date(), status: 'CANCELED' },
      where: { appointmentId, status: 'PENDING' },
    })
    await transaction.appointment.update({
      data: {
        canceledAt: new Date(),
        cancellationCause: user.role,
        cancellationReason: reason,
        status: 'CANCELED',
      },
      where: { id: appointmentId },
    })
    await transaction.appointmentHistory.create({
      data: {
        actorType,
        actorUserId: user.id,
        appointmentId,
        eventType: 'APPOINTMENT_CANCELED',
        payload: { cause: user.role, reason: reason ?? null },
      },
    })
    if (appointment.professionalUserId) {
      await transaction.professionalProfile.update({
        data: { calendarVersion: { increment: 1 } },
        where: { userId: appointment.professionalUserId },
      })
    }
  })
  return projectAppointment(await getVisibleAppointment(appointmentId, user))
}
