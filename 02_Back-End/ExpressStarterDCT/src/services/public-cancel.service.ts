import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import {
  getPublicAppointmentRecord,
  projectPublicAppointment,
} from './public-appointment.service'
import { writeNotification } from './notification-writer'

export const cancelPublicAppointment = async (
  publicCode: string,
  reason?: string,
) => {
  const appointment = await getPublicAppointmentRecord(publicCode)
  if (appointment.status === 'CANCELED') {
    return projectPublicAppointment(appointment)
  }
  if (appointment.startAt <= new Date()) {
    throw new AppError(409, 'APPOINTMENT_NOT_MODIFIABLE', { reason: 'PAST' })
  }
  await prisma.$transaction(async (transaction) => {
    await transaction.appointmentChangeProposal.updateMany({
      data: { decidedAt: new Date(), status: 'CANCELED' },
      where: { appointmentId: appointment.id, status: 'PENDING' },
    })
    await transaction.appointment.update({
      data: {
        canceledAt: new Date(),
        cancellationCause: 'CLIENT',
        cancellationReason: reason,
        status: 'CANCELED',
      },
      where: { id: appointment.id },
    })
    await transaction.appointmentHistory.create({
      data: {
        actorType: 'PUBLIC_CLIENT',
        appointmentId: appointment.id,
        eventType: 'APPOINTMENT_CANCELED',
        payload: { cause: 'CLIENT', reason: reason ?? null },
      },
    })
    await writeNotification(transaction, {
      appointmentId: appointment.id,
      eventKey: `appointment:${appointment.id}:canceled`,
      payload: {
        actor: 'CLIENT',
        range: {
          endAt: appointment.endAt.toISOString(),
          startAt: appointment.startAt.toISOString(),
        },
        reason: reason ?? null,
      },
      recipientUserId: appointment.professionalUserId,
      type: 'APPOINTMENT_CANCELED',
    })
    if (appointment.professionalUserId) {
      await transaction.professionalProfile.update({
        data: { calendarVersion: { increment: 1 } },
        where: { userId: appointment.professionalUserId },
      })
    }
  })
  return projectPublicAppointment(
    await getPublicAppointmentRecord(publicCode),
  )
}
