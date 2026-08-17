import { api } from './http'
import type { User } from '../types/api'

export const updateAccount = (body: Partial<User> & {
  expectedCalendarVersion?: number
}) => api<User>(
  '/v1/account',
  { body: JSON.stringify(body), method: 'PATCH' },
)

export const updatePassword = (body: {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}) => api<void>('/v1/account/password', {
  body: JSON.stringify(body),
  method: 'PATCH',
})

export const previewDeletion = (password: string) => api<{
  futureAppointmentCount: number
  impactFingerprint: string
}>('/v1/account/deletion-preview', {
  body: JSON.stringify({ password }),
  method: 'POST',
})

export const deleteAccount = (
  password: string,
  impactFingerprint: string,
) => api<void>('/v1/account', {
  body: JSON.stringify({ confirm: true, impactFingerprint, password }),
  method: 'DELETE',
})
