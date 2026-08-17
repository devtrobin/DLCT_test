import type { Request, Response } from 'express'

import {
  getMetrics,
  metricsContentType,
} from '../services/metrics.service'

export async function metricsController(
  _request: Request,
  response: Response,
): Promise<void> {
  response.set('Content-Type', metricsContentType)
  response.send(await getMetrics())
}
