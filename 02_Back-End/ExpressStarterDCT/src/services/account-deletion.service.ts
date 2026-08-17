import { createHash } from 'node:crypto'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { Prisma } from '../generated/client/client.js'

const deletionImpact = async (userId: number, password: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.password !== password) {
    throw new AppError(403, 'PASSWORD_INVALID')
  }
  const appointments = await prisma.appointment.findMany({
    select: { id: true, updatedAt: true },
    where: {
      OR: [{ clientUserId: userId }, { professionalUserId: userId }],
      startAt: { gt: new Date() },
      status: 'CONFIRMED',
    },
  })
  const source = JSON.stringify({
    appointments: appointments.map(({ id, updatedAt }) => [id, updatedAt]),
    userId,
  })
  return {
    futureAppointmentCount: appointments.length,
    impactFingerprint: createHash('sha256').update(source).digest('hex'),
  }
}

export const previewDeletion = deletionImpact

export const deleteAccount = async (
  userId: number,
  password: string,
  fingerprint: string,
) => {
  const impact = await deletionImpact(userId, password)
  if (impact.impactFingerprint !== fingerprint) {
    throw new AppError(409, 'ACCOUNT_DELETION_IMPACT_CHANGED', impact)
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const where = user.role === 'CLIENT'
    ? { clientUserId: userId }
    : { professionalUserId: userId }
  await prisma.$transaction(async (transaction) => {
    const future = await transaction.appointment.findMany({
      select: { id: true },
      where: { ...where, startAt: { gt: new Date() }, status: 'CONFIRMED' },
    })
    const ids = future.map(({ id }) => id)
    await transaction.appointmentChangeProposal.updateMany({
      data: { decidedAt: new Date(), status: 'CANCELED' },
      where: { appointmentId: { in: ids }, status: 'PENDING' },
    })
    await transaction.appointment.updateMany({
      data: {
        canceledAt: new Date(),
        cancellationCause: 'ACCOUNT_DELETED',
        status: 'CANCELED',
      },
      where: { id: { in: ids } },
    })
    await anonymizeAppointments(transaction, userId, user.role)
    await transaction.user.delete({ where: { id: userId } })
  })
}

const anonymizeAppointments = async (
  transaction: Prisma.TransactionClient,
  userId: number,
  role: 'CLIENT' | 'PROFESSIONAL',
) => {
  const data = role === 'CLIENT' ? {
    clientAnonymized: true,
    clientEmail: null,
    clientFirstName: null,
    clientLastName: null,
    clientPhone: null,
  } : {
    professionalAnonymized: true,
    professionalBusinessName: null,
  }
  await transaction.appointment.updateMany({
    data,
    where: role === 'CLIENT'
      ? { clientUserId: userId }
      : { professionalUserId: userId },
  })
}
