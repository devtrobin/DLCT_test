import type { SessionUser } from './auth.types'

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionUser
    }
  }
}

export {}
