import { describe, expect, it } from 'bun:test'
import request from 'supertest'

import app from './app'

describe('application infrastructure', () => {
  it('returns a stable error for an unknown route', async () => {
    const response = await request(app).get('/unknown')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'ROUTE_NOT_FOUND' })
  })
})
