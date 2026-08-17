export type AppointmentPrincipal = {
  actorType: 'CLIENT_USER' | 'PROFESSIONAL_USER' | 'PUBLIC_CLIENT'
  party: 'CLIENT' | 'PROFESSIONAL'
  userId: number | null
}

export const connectedPrincipal = (user: {
  id: number
  role: 'CLIENT' | 'PROFESSIONAL'
}): AppointmentPrincipal => ({
  actorType: user.role === 'CLIENT'
    ? 'CLIENT_USER' : 'PROFESSIONAL_USER',
  party: user.role,
  userId: user.id,
})

export const publicPrincipal: AppointmentPrincipal = {
  actorType: 'PUBLIC_CLIENT',
  party: 'CLIENT',
  userId: null,
}
