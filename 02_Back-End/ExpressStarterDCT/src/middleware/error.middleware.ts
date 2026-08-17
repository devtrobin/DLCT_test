import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { AppError } from '../errors/app-error'
import { logger } from '../services/logger'

export const errorMiddleware: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      details: error.details,
      error: error.errorCode,
    })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const reason = error instanceof Error ? error.message : 'Unknown error'
  logger.error('unhandled_error', {
    method: request.method,
    path: request.path,
    reason,
  })
  response.status(500).json({ error: 'INTERNAL_ERROR' })
}
