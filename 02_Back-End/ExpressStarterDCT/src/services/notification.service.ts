import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'

const projectNotification = (item: {
  id: number
  type: string
  payload: unknown
  appointmentId: number | null
  readAt: Date | null
  createdAt: Date
}) => ({
  appointmentAccessible: item.appointmentId !== null,
  appointmentId: item.appointmentId,
  createdAt: item.createdAt.toISOString(),
  id: item.id,
  payload: item.payload,
  readAt: item.readAt?.toISOString() ?? null,
  type: item.type,
})

export const listNotifications = async (
  userId: number,
  limit: number,
  unreadOnly: boolean,
) => {
  const notifications = await prisma.inAppNotification.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    where: {
      readAt: unreadOnly ? null : undefined,
      recipientUserId: userId,
    },
  })
  const hasNext = notifications.length > limit
  const items = notifications.slice(0, limit)
  return {
    items: items.map(projectNotification),
    nextCursor: hasNext ? btoa(String(items.at(-1)!.id)) : null,
  }
}

export const unreadNotificationCount = async (userId: number) => ({
  count: await prisma.inAppNotification.count({
    where: { readAt: null, recipientUserId: userId },
  }),
})

export const readNotification = async (userId: number, id: number) => {
  const result = await prisma.inAppNotification.updateMany({
    data: { readAt: new Date() },
    where: { id, recipientUserId: userId },
  })
  if (!result.count) throw new AppError(404, 'NOTIFICATION_NOT_FOUND')
  const item = await prisma.inAppNotification.findUniqueOrThrow({
    where: { id },
  })
  return projectNotification(item)
}

export const readAllNotifications = async (userId: number) => {
  await prisma.inAppNotification.updateMany({
    data: { readAt: new Date() },
    where: { readAt: null, recipientUserId: userId },
  })
  return unreadNotificationCount(userId)
}
