import { DateTime } from 'luxon'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { resolveLocalStarts } from './local-time.service'
import { assertTimezone, rangeView } from './time.service'

const overlaps = (
  start: Date,
  end: Date,
  ranges: Array<{ startAt: Date; endAt: Date }>,
) => ranges.some((range) => range.startAt < end && range.endAt > start)

export const generateSlots = async (
  professionalId: number,
  from: string,
  displayTimezone: string,
  excludedAppointmentId?: number,
) => {
  assertTimezone(displayTimezone)
  const firstDay = DateTime.fromISO(from, { zone: displayTimezone })
  if (!firstDay.isValid) throw new AppError(400, 'VALIDATION_ERROR')
  const profile = await prisma.professionalProfile.findUnique({
    include: {
      weeklyAvailabilities: true,
      unavailabilities: true,
    },
    where: { userId: professionalId },
  })
  if (!profile) throw new AppError(404, 'PROFESSIONAL_NOT_FOUND')
  const windowStart = firstDay.startOf('day').toUTC()
  const windowEnd = firstDay.plus({ days: 7 }).startOf('day').toUTC()
  const appointments = await prisma.appointment.findMany({
    select: { endAt: true, startAt: true },
    where: {
      id: excludedAppointmentId ? { not: excludedAppointmentId } : undefined,
      professionalUserId: professionalId,
      endAt: { gt: windowStart.minus({ days: 2 }).toJSDate() },
      startAt: { lt: windowEnd.plus({ days: 2 }).toJSDate() },
      status: 'CONFIRMED',
    },
  })
  const slots = buildSlots(
    firstDay,
    profile.timezone,
    profile.weeklyAvailabilities,
  ).filter(({ startAt, endAt }) =>
    startAt > new Date()
    && !overlaps(startAt, endAt, profile.unavailabilities)
    && !overlaps(startAt, endAt, appointments),
  )
  const days = Array.from({ length: 7 }, (_, index) => ({
    localDate: firstDay.plus({ days: index }).toISODate()!,
    slots: [] as Array<{ range: ReturnType<typeof rangeView> }>,
  }))
  slots.forEach(({ startAt, endAt }) => {
    const date = DateTime.fromJSDate(startAt, { zone: displayTimezone })
      .toISODate()
    const day = days.find((item) => item.localDate === date)
    if (day) day.slots.push({ range: rangeView(startAt, endAt) })
  })
  return {
    calendarVersion: profile.calendarVersion,
    days,
    from,
    professional: {
      businessName: profile.businessName,
      id: profile.userId,
      timezone: profile.timezone,
    },
    timezone: displayTimezone,
  }
}

const buildSlots = (
  firstDay: DateTime,
  timezone: string,
  periods: Array<{ weekday: number; startMinute: number; endMinute: number }>,
) => {
  const professionalStart = firstDay.setZone(timezone).minus({ days: 2 })
  return Array.from({ length: 11 }, (_, index) =>
    professionalStart.plus({ days: index }).startOf('day'),
  ).flatMap((date) => periods
    .filter((period) => period.weekday === date.weekday)
    .flatMap((period) => {
      const starts = [] as DateTime[]
      for (let minute = period.startMinute;
        minute + 60 <= period.endMinute; minute += 15) {
        starts.push(...resolveLocalStarts({ date, minute, timezone }))
      }
      return starts.map((start) => ({
        endAt: start.plus({ minutes: 60 }).toJSDate(),
        startAt: start.toJSDate(),
      }))
    }))
}
