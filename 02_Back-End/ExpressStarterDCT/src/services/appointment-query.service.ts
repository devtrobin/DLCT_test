import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { Prisma } from '../generated/client/client.js'

export const appointmentInclude = {
  history: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  proposals: {
    orderBy: { createdAt: 'desc' },
    where: { status: 'PENDING' },
  },
} satisfies Prisma.AppointmentInclude

export const getAppointmentRecord = async (id: number) => {
  const appointment = await prisma.appointment.findUnique({
    include: appointmentInclude,
    where: { id },
  })
  if (!appointment) throw new AppError(404, 'APPOINTMENT_NOT_FOUND')
  return appointment
}

export const getVisibleAppointment = async (
  id: number,
  user: { id: number; role: 'CLIENT' | 'PROFESSIONAL' },
) => {
  const appointment = await getAppointmentRecord(id)
  const visible = user.role === 'CLIENT'
    ? appointment.clientUserId === user.id
    : appointment.professionalUserId === user.id
  if (!visible) throw new AppError(404, 'APPOINTMENT_NOT_FOUND')
  return appointment
}

export type AppointmentRecord = Awaited<
  ReturnType<typeof getAppointmentRecord>
>
