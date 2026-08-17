import client, { Registry } from 'prom-client'

import { environment } from '../config/environment'

const register = new Registry()
const prefix = environment.APP_NAME

client.collectDefaultMetrics({ prefix, register })

export const httpRequestsTotal = new client.Counter({
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  name: `${prefix}_http_requests_total`,
  registers: [register],
})

export const httpRequestDuration = new client.Histogram({
  buckets: [0.005, 0.025, 0.1, 0.5, 1, 2.5, 5],
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  name: `${prefix}_http_request_duration_seconds`,
  registers: [register],
})

export function getMetrics(): Promise<string> {
  return register.metrics()
}

export const metricsContentType = register.contentType
