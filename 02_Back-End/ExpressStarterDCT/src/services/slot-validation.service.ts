import { DateTime } from 'luxon'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'

export const assertSlotAvailable = async (
  professionalId: number,
  startAt: Date,
  excludedAppointmentId?: number,
) => {
  const endAt = DateTime.fromJSDate(startAt).plus({ hours: 1 }).toJSDate()
  if (startAt <= new Date()) {
    throw new AppError(409, 'APPOINTMENT_SLOT_UNAVAILABLE')
  }
  const profile = await prisma.professionalProfile.findUnique({
    include: { weeklyAvailabilities: true },
    where: { userId: professionalId },
  })
  if (!profile) throw new AppError(404, 'PROFESSIONAL_NOT_FOUND')
  const local = DateTime.fromJSDate(startAt, { zone: profile.timezone })
  const minute = local.hour * 60 + local.minute
  const covered = profile.weeklyAvailabilities.some((period) =>
    period.weekday === local.weekday
    && period.startMinute <= minute
    && period.endMinute >= minute + 60
    && minute % 15 === 0,
  )
  if (!covered) throw new AppError(409, 'APPOINTMENT_SLOT_UNAVAILABLE')
  const blocked = await prisma.unavailability.findFirst({
    where: {
      endAt: { gt: startAt },
      professionalUserId: professionalId,
      startAt: { lt: endAt },
    },
  })
  const appointment = await prisma.appointment.findFirst({
    where: {
      endAt: { gt: startAt },
      id: excludedAppointmentId ? { not: excludedAppointmentId } : undefined,
      professionalUserId: professionalId,
      startAt: { lt: endAt },
      status: 'CONFIRMED',
    },
  })
  if (blocked) throw new AppError(409, 'APPOINTMENT_SLOT_UNAVAILABLE')
  if (appointment) throw new AppError(409, 'APPOINTMENT_CONFLICT')
  return { endAt, profile }
}
