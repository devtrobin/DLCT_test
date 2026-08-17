import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { rangeView, timeFromMinute } from './time.service'

export const getWeeklyAvailability = async (userId: number) => {
  const profile = await prisma.professionalProfile.findUnique({
    include: {
      weeklyAvailabilities: {
        orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
      },
    },
    where: { userId },
  })
  if (!profile) throw new AppError(404, 'PROFESSIONAL_NOT_FOUND')
  return {
    calendarVersion: profile.calendarVersion,
    periods: profile.weeklyAvailabilities.map((period) => ({
      endTime: timeFromMinute(period.endMinute),
      id: period.id,
      startTime: timeFromMinute(period.startMinute),
      weekday: period.weekday,
    })),
    timezone: profile.timezone,
  }
}

export const getUnavailabilities = async (
  userId: number,
  from?: string,
  to?: string,
) => {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId },
  })
  if (!profile) throw new AppError(404, 'PROFESSIONAL_NOT_FOUND')
  const items = await prisma.unavailability.findMany({
    orderBy: { startAt: 'asc' },
    where: {
      endAt: from ? { gt: new Date(from) } : undefined,
      professionalUserId: userId,
      startAt: to ? { lt: new Date(to) } : undefined,
    },
  })
  return {
    calendarVersion: profile.calendarVersion,
    items: items.map((item) => ({
      createdAt: item.createdAt.toISOString(),
      id: item.id,
      range: rangeView(item.startAt, item.endAt),
      reason: item.reason,
    })),
  }
}
