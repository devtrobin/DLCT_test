import type { z } from 'zod'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { weeklyAvailabilitySchema } from '../schemas/calendar.schemas'
import {
  cancelAppointments,
  impactFingerprint,
  requireImpactConfirmation,
} from './calendar-impact.service'
import { getWeeklyAvailability } from './calendar-query.service'
import {
  isCoveredByPeriods,
  normalizePeriods,
  validatePeriods,
} from './weekly-period.service'

type Input = z.infer<typeof weeklyAvailabilitySchema>

export const replaceWeeklyAvailability = async (
  userId: number,
  input: Input,
) => {
  const periods = normalizePeriods(input.periods)
  validatePeriods(periods)
  const profile = await prisma.professionalProfile.findUniqueOrThrow({
    where: { userId },
  })
  if (profile.calendarVersion !== input.expectedCalendarVersion) {
    throw new AppError(409, 'CALENDAR_VERSION_CONFLICT', {
      calendarVersion: profile.calendarVersion,
      restartPreview: true,
    })
  }
  const appointments = await prisma.appointment.findMany({
    where: {
      professionalUserId: userId,
      startAt: { gt: new Date() },
      status: 'CONFIRMED',
    },
  })
  const impacted = appointments.filter((item) =>
    !isCoveredByPeriods(item.startAt, profile.timezone, periods),
  )
  const fingerprint = impactFingerprint(
    'WEEKLY_AVAILABILITY', periods, profile.calendarVersion, impacted,
  )
  requireImpactConfirmation(
    impacted, fingerprint, input.confirmCancellations,
    input.impactFingerprint,
  )
  await prisma.$transaction(async (transaction) => {
    await transaction.weeklyAvailability.deleteMany({
      where: { professionalUserId: userId },
    })
    await transaction.weeklyAvailability.createMany({
      data: periods.map((period) => ({
        ...period,
        professionalUserId: userId,
      })),
    })
    await cancelAppointments(
      transaction, impacted.map(({ id }) => id), 'SCHEDULE_CHANGED',
    )
    await transaction.professionalProfile.update({
      data: { calendarVersion: { increment: 1 } },
      where: { userId },
    })
  })
  return getWeeklyAvailability(userId)
}
