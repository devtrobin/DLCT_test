import { DateTime } from 'luxon'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { UserRole } from '../generated/client/enums'
import { appointmentInclude } from './appointment-query.service'
import { projectAppointmentSummary } from './appointment-projector'
import { assertTimezone } from './time.service'

type ClientQuery = {
  cursor?: string
  limit: number
  timezone?: string
  view: 'UPCOMING' | 'HISTORY'
}

export const listClientAppointments = async (
  userId: number,
  query: ClientQuery,
) => {
  if (query.timezone) assertTimezone(query.timezone)
  const upcoming = query.view === 'UPCOMING'
  const appointments = await prisma.appointment.findMany({
    include: appointmentInclude,
    orderBy: [
      { startAt: upcoming ? 'asc' : 'desc' },
      { id: upcoming ? 'asc' : 'desc' },
    ],
    take: query.limit + 1,
    where: {
      clientUserId: userId,
      ...(upcoming ? {
        startAt: { gte: new Date() },
        status: 'CONFIRMED' as const,
      } : {
        OR: [
          { status: 'CANCELED' as const },
          { startAt: { lt: new Date() } },
        ],
      }),
    },
  })
  const hasNext = appointments.length > query.limit
  const items = appointments.slice(0, query.limit)
  return {
    items: items.map(projectAppointmentSummary),
    nextCursor: hasNext ? btoa(String(items.at(-1)!.id)) : null,
    view: query.view,
  }
}

export const listProfessionalAgenda = async (
  userId: number,
  from: string,
  includeCanceled: boolean,
) => {
  const profile = await prisma.professionalProfile.findUniqueOrThrow({
    where: { userId },
  })
  const firstDay = DateTime.fromISO(from, { zone: profile.timezone })
  if (!firstDay.isValid || firstDay.weekday !== 1) {
    throw new AppError(400, 'VALIDATION_ERROR')
  }
  const end = firstDay.plus({ days: 7 })
  const appointments = await prisma.appointment.findMany({
    include: appointmentInclude,
    orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    where: {
      professionalUserId: userId,
      startAt: { gte: firstDay.toUTC().toJSDate(), lt: end.toUTC().toJSDate() },
      status: includeCanceled ? undefined : 'CONFIRMED',
    },
  })
  const days = Array.from({ length: 7 }, (_, index) => ({
    appointments: appointments.filter((appointment) =>
      DateTime.fromJSDate(appointment.startAt, { zone: profile.timezone })
        .toISODate() === firstDay.plus({ days: index }).toISODate(),
    ).map(projectAppointmentSummary),
    localDate: firstDay.plus({ days: index }).toISODate(),
  }))
  return {
    calendarVersion: profile.calendarVersion,
    days,
    from,
    timezone: profile.timezone,
  }
}

export const isAppointmentRole = (role: UserRole) =>
  role === 'CLIENT' || role === 'PROFESSIONAL'
