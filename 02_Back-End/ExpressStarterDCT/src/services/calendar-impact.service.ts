import { createHash } from 'node:crypto'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { Prisma } from '../generated/client/client.js'
import { rangeView } from './time.service'

type ImpactAppointment = {
  id: number
  clientFirstName: string | null
  clientLastName: string | null
  startAt: Date
  endAt: Date
  updatedAt: Date
}

export const impactFingerprint = (
  operation: string,
  mutation: unknown,
  version: number,
  appointments: ImpactAppointment[],
) => createHash('sha256').update(JSON.stringify({
  appointments: appointments.map((item) => ({
    id: item.id,
    startAt: item.startAt,
    updatedAt: item.updatedAt,
  })),
  mutation,
  operation,
  version,
})).digest('hex')

export const requireImpactConfirmation = (
  appointments: ImpactAppointment[],
  fingerprint: string,
  confirm: boolean,
  provided?: string,
) => {
  if (!appointments.length) return
  const details = {
    appointments: appointments.map((item) => ({
      clientDisplayName: [item.clientFirstName, item.clientLastName]
        .filter(Boolean).join(' '),
      id: item.id,
      range: rangeView(item.startAt, item.endAt),
    })),
    impactFingerprint: fingerprint,
  }
  if (!confirm) {
    throw new AppError(409, 'CALENDAR_CHANGE_CONFIRMATION_REQUIRED', details)
  }
  if (provided !== fingerprint) {
    throw new AppError(409, 'CALENDAR_IMPACT_CHANGED', details)
  }
}

export const cancelAppointments = async (
  database: Prisma.TransactionClient | typeof prisma,
  ids: number[],
  cause: 'SCHEDULE_CHANGED' | 'UNAVAILABILITY',
  reason?: string,
) => {
  if (!ids.length) return
  await database.appointmentChangeProposal.updateMany({
    data: { decidedAt: new Date(), status: 'CANCELED' },
    where: { appointmentId: { in: ids }, status: 'PENDING' },
  })
  await database.appointment.updateMany({
    data: {
      canceledAt: new Date(),
      cancellationCause: cause,
      cancellationReason: reason,
      status: 'CANCELED',
    },
    where: { id: { in: ids } },
  })
}
