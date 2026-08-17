import type { RequestHandler } from 'express'

import { notificationListSchema } from '../schemas/notification.schemas'
import {
  listNotifications,
  readAllNotifications,
  readNotification,
  unreadNotificationCount,
} from '../services/notification.service'

export const listNotificationsController: RequestHandler = async (
  request,
  response,
) => {
  const query = notificationListSchema.parse(request.query)
  response.json(await listNotifications(
    request.sessionUser!.id,
    query.limit,
    query.unreadOnly,
  ))
}

export const unreadCountController: RequestHandler = async (
  request,
  response,
) => {
  response.json(await unreadNotificationCount(request.sessionUser!.id))
}

export const readNotificationController: RequestHandler = async (
  request,
  response,
) => {
  response.json(await readNotification(
    request.sessionUser!.id,
    Number(request.params.id),
  ))
}

export const readAllNotificationsController: RequestHandler = async (
  request,
  response,
) => {
  response.json(await readAllNotifications(request.sessionUser!.id))
}
