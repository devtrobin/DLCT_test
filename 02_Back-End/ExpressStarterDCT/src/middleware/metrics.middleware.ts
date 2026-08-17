import type { NextFunction, Request, Response } from 'express'

import {
  httpRequestDuration,
  httpRequestsTotal,
} from '../services/metrics.service'

const excludedPaths = new Set(['/health', '/metrics'])

export function metricsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (excludedPaths.has(request.path)) {
    next()
    return
  }

  const stopTimer = httpRequestDuration.startTimer()

  response.on('finish', () => {
    const labels = {
      method: request.method,
      route: request.route?.path ?? 'unknown',
      status_code: response.statusCode.toString(),
    }
    stopTimer(labels)
    httpRequestsTotal.inc(labels)
  })

  next()
}
