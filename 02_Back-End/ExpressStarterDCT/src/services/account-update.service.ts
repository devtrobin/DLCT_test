import { DateTime } from 'luxon'
import type { z } from 'zod'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { accountUpdateSchema } from '../schemas/account.schemas'
import { getAccount } from './account-query.service'

type AccountUpdate = z.infer<typeof accountUpdateSchema>

const verifyTimezone = (timezone?: string) => {
  if (timezone && !DateTime.now().setZone(timezone).isValid) {
    throw new AppError(400, 'INVALID_TIMEZONE')
  }
}

export const updateAccount = async (
  userId: number,
  role: 'CLIENT' | 'PROFESSIONAL',
  input: AccountUpdate,
) => {
  verifyTimezone(input.timezone)
  if (role === 'CLIENT' && input.businessName !== undefined) {
    throw new AppError(400, 'VALIDATION_ERROR')
  }
  if (role === 'PROFESSIONAL' && input.timezone) {
    await updateProfessionalTimezone(userId, input)
  }
  await prisma.user.update({
    data: {
      email: input.email,
      clientProfile: role === 'CLIENT' ? {
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          preferredTimezone: input.timezone,
        },
      } : undefined,
      professionalProfile: role === 'PROFESSIONAL' ? {
        update: {
          businessName: input.businessName,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      } : undefined,
    },
    where: { id: userId },
  })
  return getAccount(userId)
}

const updateProfessionalTimezone = async (
  userId: number,
  input: AccountUpdate,
) => {
  if (input.expectedCalendarVersion === undefined) {
    throw new AppError(400, 'CALENDAR_VERSION_REQUIRED')
  }
  const future = await prisma.appointment.count({
    where: {
      professionalUserId: userId,
      startAt: { gt: new Date() },
      status: 'CONFIRMED',
    },
  })
  if (future) throw new AppError(409, 'PROFESSIONAL_TIMEZONE_LOCKED')
  const result = await prisma.professionalProfile.updateMany({
    data: {
      calendarVersion: { increment: 1 },
      timezone: input.timezone,
    },
    where: {
      calendarVersion: input.expectedCalendarVersion,
      userId,
    },
  })
  if (!result.count) throw new AppError(409, 'CALENDAR_VERSION_CONFLICT')
}
