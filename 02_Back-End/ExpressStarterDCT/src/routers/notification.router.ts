import { Router } from 'express'

import {
  listNotificationsController,
  readAllNotificationsController,
  readNotificationController,
  unreadCountController,
} from '../controllers/notification.controller'

export const notificationRouter = Router()

notificationRouter.get('/', listNotificationsController)
notificationRouter.get('/unread-count', unreadCountController)
notificationRouter.patch('/:id/read', readNotificationController)
notificationRouter.post('/read-all', readAllNotificationsController)
