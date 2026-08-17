import type { UserView } from '../types/auth.types'

type ProjectableUser = {
  id: number
  email: string
  role: 'CLIENT' | 'PROFESSIONAL'
  createdAt: Date
  clientProfile: null | {
    firstName: string
    lastName: string
    phone: string
    preferredTimezone: string
  }
  professionalProfile: null | {
    firstName: string
    lastName: string
    phone: string
    timezone: string
    businessName: string
    calendarVersion: number
  }
}

export const projectUser = (user: ProjectableUser): UserView => {
  const profile = user.clientProfile ?? user.professionalProfile
  if (!profile) throw new Error('USER_PROFILE_MISSING')

  const professional = user.professionalProfile
  const timezone = user.clientProfile?.preferredTimezone
    ?? professional?.timezone
  if (!timezone) throw new Error('USER_TIMEZONE_MISSING')

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    timezone,
    businessName: professional?.businessName ?? null,
    calendarVersion: professional?.calendarVersion ?? null,
    createdAt: user.createdAt.toISOString(),
  }
}
