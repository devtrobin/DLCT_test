import type { RequestHandler } from 'express'

import {
  loginSchema,
  recoverySchema,
  registrationSchema,
} from '../schemas/auth.schemas'
import { login, recoverPassword, register } from '../services/auth.service'
import {
  findSession,
  removeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../services/session.service'

export const registerController: RequestHandler = async (request, response) => {
  const session = await register(registrationSchema.parse(request.body))
  response.cookie(
    SESSION_COOKIE,
    session.id,
    sessionCookieOptions(new Date(session.view.expiresAt)),
  )
  response.status(201).json(session.view)
}

export const loginController: RequestHandler = async (request, response) => {
  const session = await login(loginSchema.parse(request.body))
  response.cookie(
    SESSION_COOKIE,
    session.id,
    sessionCookieOptions(new Date(session.view.expiresAt)),
  )
  response.json(session.view)
}

export const logoutController: RequestHandler = async (request, response) => {
  await removeSession(request.cookies[SESSION_COOKIE])
  response.clearCookie(SESSION_COOKIE, sessionCookieOptions())
  response.status(204).send()
}

export const sessionController: RequestHandler = async (request, response) => {
  const session = await findSession(request.cookies[SESSION_COOKIE])
  response.json(session ?? { authenticated: false })
}

export const recoveryController: RequestHandler = async (request, response) => {
  const result = await recoverPassword(recoverySchema.parse(request.body))
  response.setHeader('Cache-Control', 'no-store, private')
  response.setHeader('Pragma', 'no-cache')
  response.json(result)
}
