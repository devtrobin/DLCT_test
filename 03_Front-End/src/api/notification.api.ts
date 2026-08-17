import { api } from './http'
import type { Notification } from '../types/api'

export const listNotifications = () => api<{
  items: Notification[]
}>('/v1/notifications')

export const unreadCount = () => api<{ count: number }>(
  '/v1/notifications/unread-count',
)

export const markRead = (id: number) => api<Notification>(
  `/v1/notifications/${id}/read`,
  { method: 'PATCH' },
)

export const markAllRead = () => api<{ count: number }>(
  '/v1/notifications/read-all',
  { method: 'POST' },
)
