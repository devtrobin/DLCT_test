import compression from 'compression'
import type { RequestHandler } from 'express'

// The current compression types still target Express 4.
export const compressionMiddleware =
  compression() as unknown as RequestHandler
