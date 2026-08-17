import type { RequestHandler } from 'express'

import { AppError } from '../errors/app-error'
import { findSession, SESSION_COOKIE } from '../services/session.service'

export const requireSession: RequestHandler = async (
  request,
  _response,
  next,
) => {
  const session = await findSession(request.cookies[SESSION_COOKIE])
  if (!session) throw new AppError(401, 'AUTHENTICATION_REQUIRED')
  request.sessionUser = {
    id: session.user.id,
    role: session.user.role,
  }
  next()
}

export const requireRole = (role: 'CLIENT' | 'PROFESSIONAL'):
RequestHandler => (request, _response, next) => {
  if (request.sessionUser?.role !== role) {
    throw new AppError(403, 'ROLE_FORBIDDEN')
  }
  next()
}
