import { randomBytes } from 'node:crypto'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { getAppointmentRecord } from './appointment-query.service'
import { projectAppointment } from './appointment-projector'

type BookingData = {
  clientEmail: string
  clientFirstName: string
  clientLastName: string
  clientPhone: string
  clientUserId: number | null
  endAt: Date
  professionalBusinessName: string
  professionalTimezone: string
  professionalUserId: number
  startAt: Date
}

export const writeBooking = async (
  data: BookingData,
  source: 'CLIENT' | 'PROFESSIONAL',
) => {
  try {
    const appointment = await prisma.$transaction(async (transaction) => {
      const created = await transaction.appointment.create({
        data: {
          ...data,
          publicCode: randomBytes(24).toString('base64url'),
        },
      })
      await transaction.appointmentHistory.create({
        data: {
          actorType: source === 'CLIENT'
            ? 'CLIENT_USER' : 'PROFESSIONAL_USER',
          actorUserId: source === 'CLIENT'
            ? data.clientUserId : data.professionalUserId,
          appointmentId: created.id,
          eventType: source === 'CLIENT'
            ? 'APPOINTMENT_CREATED' : 'MANUAL_APPOINTMENT_CREATED',
          payload: { source },
        },
      })
      await transaction.professionalProfile.update({
        data: { calendarVersion: { increment: 1 } },
        where: { userId: data.professionalUserId },
      })
      return created
    }, { isolationLevel: 'Serializable' })
    return projectAppointment(await getAppointmentRecord(appointment.id))
  } catch (error) {
    if (isDatabaseConflict(error)) {
      throw new AppError(409, 'APPOINTMENT_CONFLICT')
    }
    throw error
  }
}

const isDatabaseConflict = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string }
  return candidate.code === 'P2002'
    || candidate.code === 'P2034'
    || candidate.message?.includes('appointment_no_overlap') === true
}
