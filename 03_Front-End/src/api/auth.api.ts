import { api } from './http'
import type { Session, UserRole } from '../types/api'

export type Registration = {
  role: UserRole
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  timezone: string
  businessName?: string
}

export const register = (body: Registration) => api<Session>(
  '/auth/register',
  { body: JSON.stringify(body), method: 'POST' },
)

export const login = (body: {
  role: UserRole
  email: string
  password: string
  rememberMe: boolean
}) => api<Session>('/auth/login', {
  body: JSON.stringify(body),
  method: 'POST',
})

export const logout = () => api<void>('/auth/logout', { method: 'POST' })
export const getSession = () => api<Session>('/auth/session')

export const recoverPassword = (email: string, role: UserRole) => api<{
  warning: string
  password: string
}>('/auth/demo-password-recovery', {
  body: JSON.stringify({ email, role }),
  method: 'POST',
})
