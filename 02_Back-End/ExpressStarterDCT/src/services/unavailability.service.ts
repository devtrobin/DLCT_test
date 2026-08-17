import type { z } from 'zod'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { unavailabilityCreationSchema } from '../schemas/calendar.schemas'
import {
  cancelAppointments,
  impactFingerprint,
  requireImpactConfirmation,
} from './calendar-impact.service'
import { rangeView } from './time.service'

type Input = z.infer<typeof unavailabilityCreationSchema>

export const requireCalendarVersion = async (
  userId: number,
  expected: number,
) => {
  const profile = await prisma.professionalProfile.findUniqueOrThrow({
    where: { userId },
  })
  if (profile.calendarVersion !== expected) {
    throw new AppError(409, 'CALENDAR_VERSION_CONFLICT', {
      calendarVersion: profile.calendarVersion,
      restartPreview: true,
    })
  }
  return profile
}

export const createUnavailability = async (userId: number, input: Input) => {
  const profile = await requireCalendarVersion(
    userId,
    input.expectedCalendarVersion,
  )
  const startAt = new Date(input.startAt)
  const endAt = new Date(input.endAt)
  const overlap = await prisma.unavailability.findFirst({
    where: {
      endAt: { gt: startAt },
      professionalUserId: userId,
      startAt: { lt: endAt },
    },
  })
  if (overlap) throw new AppError(409, 'UNAVAILABILITY_CONFLICT')
  const impacted = await prisma.appointment.findMany({
    where: {
      endAt: { gt: startAt },
      professionalUserId: userId,
      startAt: { lt: endAt },
      status: 'CONFIRMED',
    },
  })
  const fingerprint = impactFingerprint(
    'UNAVAILABILITY', { endAt, startAt }, profile.calendarVersion, impacted,
  )
  requireImpactConfirmation(
    impacted, fingerprint, input.confirmCancellations,
    input.impactFingerprint,
  )
  if (impacted.length && !input.reason) {
    throw new AppError(400, 'UNAVAILABILITY_REASON_REQUIRED')
  }
  const result = await prisma.$transaction(async (transaction) => {
    const item = await transaction.unavailability.create({
      data: {
        endAt,
        professionalUserId: userId,
        reason: input.reason,
        startAt,
      },
    })
    await cancelAppointments(
      transaction, impacted.map(({ id }) => id),
      'UNAVAILABILITY', input.reason,
    )
    const updated = await transaction.professionalProfile.update({
      data: { calendarVersion: { increment: 1 } },
      where: { userId },
    })
    return { item, version: updated.calendarVersion }
  })
  return {
    calendarVersion: result.version,
    unavailability: {
      createdAt: result.item.createdAt.toISOString(),
      id: result.item.id,
      range: rangeView(result.item.startAt, result.item.endAt),
      reason: result.item.reason,
    },
  }
}
