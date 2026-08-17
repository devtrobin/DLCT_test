import { afterAll, describe, expect, test } from 'bun:test'
import request from 'supertest'

import app from './app'
import { prisma } from './database/prisma'

const email = `auth-${Date.now()}@example.test`

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
})

describe('authentication', () => {
  test('registers a client and creates a session', async () => {
    const agent = request.agent(app)
    const registration = await agent.post('/auth/register').send({
      email,
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: 'Password',
      phone: '+33000000000',
      role: 'CLIENT',
      timezone: 'Europe/Paris',
    })

    expect(registration.status).toBe(201)
    expect(registration.body.authenticated).toBe(true)
    expect(registration.body.user.email).toBe(email)

    const session = await agent.get('/auth/session')
    expect(session.status).toBe(200)
    expect(session.body.user.role).toBe('CLIENT')

    const account = await agent.get('/v1/account')
    expect(account.status).toBe(200)
    expect(account.body.firstName).toBe('Ada')

    const logout = await agent.post('/auth/logout')
    expect(logout.status).toBe(204)
  })

  test('rejects invalid credentials without leaking the cause', async () => {
    const response = await request(app).post('/auth/login').send({
      email,
      password: 'wrong-password',
      role: 'CLIENT',
    })
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('INVALID_CREDENTIALS')
  })

  test('exposes the demo password recovery warning', async () => {
    const response = await request(app)
      .post('/auth/demo-password-recovery')
      .send({ email, role: 'CLIENT' })
    expect(response.status).toBe(200)
    expect(response.body.warning).toBe('DEMO_PLAINTEXT_PASSWORD')
  })
})
