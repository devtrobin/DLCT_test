import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { requireCalendarVersion } from './unavailability.service'

export const deleteUnavailability = async (
  userId: number,
  id: number,
  version: number,
) => {
  await requireCalendarVersion(userId, version)
  const result = await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.unavailability.deleteMany({
      where: { id, professionalUserId: userId },
    })
    if (!deleted.count) {
      throw new AppError(404, 'UNAVAILABILITY_NOT_FOUND')
    }
    return transaction.professionalProfile.update({
      data: { calendarVersion: { increment: 1 } },
      where: { userId },
    })
  })
  return { calendarVersion: result.calendarVersion }
}
