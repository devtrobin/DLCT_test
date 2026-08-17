import type { z } from 'zod'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { clientAppointmentSchema } from '../schemas/appointment.schemas'
import { writeBooking } from './booking-write.service'
import { assertSlotAvailable } from './slot-validation.service'

type Input = z.infer<typeof clientAppointmentSchema>

export const createClientBooking = async (userId: number, input: Input) => {
  const client = await prisma.clientProfile.findUnique({
    include: { user: true },
    where: { userId },
  })
  if (!client) throw new AppError(404, 'ACCOUNT_NOT_FOUND')
  const startAt = new Date(input.startAt)
  const { endAt, profile } = await assertSlotAvailable(
    input.professionalId,
    startAt,
  )
  return writeBooking({
    clientEmail: client.user.email,
    clientFirstName: client.firstName,
    clientLastName: client.lastName,
    clientPhone: client.phone,
    clientUserId: userId,
    endAt,
    professionalBusinessName: profile.businessName,
    professionalTimezone: profile.timezone,
    professionalUserId: input.professionalId,
    startAt,
  }, 'CLIENT')
}
