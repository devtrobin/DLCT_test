export type UserRole = 'CLIENT' | 'PROFESSIONAL'

export type User = {
  id: number
  role: UserRole
  email: string
  firstName: string
  lastName: string
  phone: string
  timezone: string
  businessName: string | null
  calendarVersion: number | null
}

export type Session = {
  authenticated: boolean
  user?: User
  expiresAt?: string
}

export type Professional = {
  id: number
  businessName: string
  timezone: string
}

export type TimeRange = { startAt: string; endAt: string }
export type SlotDay = {
  localDate: string
  slots: Array<{ range: TimeRange }>
}

export type Appointment = {
  id: number
  status: 'CONFIRMED' | 'CANCELED'
  range: TimeRange
  publicCode: string | null
  professional: {
    businessName: string | null
    timezone: string
  }
  client: {
    firstName: string | null
    lastName: string | null
  }
  cancellationReason: string | null
  pendingProposal: Proposal | null
}

export type Proposal = {
  id: number
  status: string
  authorParty: UserRole
  recipientParty: UserRole
  proposedRange: TimeRange
}

export type Notification = {
  id: number
  type: string
  payload: Record<string, unknown>
  appointmentId: number | null
  readAt: string | null
  createdAt: string
}
