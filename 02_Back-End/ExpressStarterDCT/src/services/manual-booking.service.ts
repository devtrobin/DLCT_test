import type { z } from 'zod'

import { prisma } from '../database/prisma'
import type { manualAppointmentSchema } from '../schemas/appointment.schemas'
import { writeBooking } from './booking-write.service'
import { assertSlotAvailable } from './slot-validation.service'

type Input = z.infer<typeof manualAppointmentSchema>

export const createManualBooking = async (
  professionalId: number,
  input: Input,
) => {
  const startAt = new Date(input.startAt)
  const { endAt, profile } = await assertSlotAvailable(
    professionalId,
    startAt,
  )
  const client = await prisma.user.findUnique({
    where: {
      role_email: { email: input.client.email, role: 'CLIENT' },
    },
  })
  const appointment = await writeBooking({
    clientEmail: input.client.email,
    clientFirstName: input.client.firstName,
    clientLastName: input.client.lastName,
    clientPhone: input.client.phone,
    clientUserId: client?.id ?? null,
    endAt,
    professionalBusinessName: profile.businessName,
    professionalTimezone: profile.timezone,
    professionalUserId: professionalId,
    startAt,
  }, 'PROFESSIONAL')
  return { appointment, clientLinked: client !== null }
}
