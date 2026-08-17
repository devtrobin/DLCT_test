import { randomBytes } from 'node:crypto'

import { DateTime } from 'luxon'

import { environment } from '../config/environment'
import { prisma } from '../database/prisma'
import type { SessionView } from '../types/auth.types'
import { projectUser } from './user-projector'

export const SESSION_COOKIE = 'delicity_session'

const userInclude = {
  clientProfile: true,
  professionalProfile: true,
} as const

export const sessionCookieOptions = (expiresAt?: Date) => ({
  domain: environment.COOKIE_DOMAIN || undefined,
  expires: expiresAt,
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: environment.NODE_ENV === 'production',
})

export const createSession = async (
  userId: number,
  rememberMe: boolean,
): Promise<{ id: string; view: SessionView }> => {
  const amount = rememberMe
    ? { days: environment.PERSISTENT_SESSION_TTL_DAYS }
    : { hours: environment.SESSION_TTL_HOURS }
  const expiresAt = DateTime.utc().plus(amount).toJSDate()
  const id = randomBytes(32).toString('hex')
  const session = await prisma.session.create({
    data: { expiresAt, id, userId },
    include: { user: { include: userInclude } },
  })
  return {
    id,
    view: {
      authenticated: true,
      expiresAt: expiresAt.toISOString(),
      user: projectUser(session.user),
    },
  }
}

export const findSession = async (
  id?: string,
): Promise<SessionView | null> => {
  if (!id) return null
  const session = await prisma.session.findUnique({
    include: { user: { include: userInclude } },
    where: { id },
  })
  if (!session || session.expiresAt <= new Date()) return null
  return {
    authenticated: true,
    expiresAt: session.expiresAt.toISOString(),
    user: projectUser(session.user),
  }
}

export const removeSession = async (id?: string) => {
  if (!id) return
  await prisma.session.deleteMany({ where: { id } })
}
