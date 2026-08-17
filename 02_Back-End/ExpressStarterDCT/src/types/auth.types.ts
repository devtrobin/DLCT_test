import type { UserRole } from '../generated/client/enums'

export type UserView = {
  id: number
  role: UserRole
  email: string
  firstName: string
  lastName: string
  phone: string
  timezone: string
  businessName: string | null
  calendarVersion: number | null
  createdAt: string
}

export type SessionView = {
  authenticated: true
  user: UserView
  expiresAt: string
}

export type SessionUser = {
  id: number
  role: UserRole
}
