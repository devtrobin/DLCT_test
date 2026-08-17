import { afterAll, describe, expect, test } from 'bun:test'
import { DateTime } from 'luxon'
import request from 'supertest'

import app from './app'
import { prisma } from './database/prisma'

const suffix = Date.now()
const email = `calendar-${suffix}@example.test`
const businessName = `Calendar ${suffix}`
const agent = request.agent(app)
let professionalId = 0
let version = 0

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
})

describe('professional calendar', () => {
  test('registers a professional', async () => {
    const response = await agent.post('/auth/register').send({
      businessName,
      email,
      firstName: 'Sophie',
      lastName: 'Demo',
      password: 'Password',
      phone: '+33000000000',
      role: 'PROFESSIONAL',
      timezone: 'Europe/Paris',
    })
    expect(response.status).toBe(201)
    professionalId = response.body.user.id
  })

  test('replaces and reads weekly availability', async () => {
    const periods = Array.from({ length: 7 }, (_, index) => ({
      endTime: '18:00',
      startTime: '09:00',
      weekday: index + 1,
    }))
    const response = await agent
      .put('/v1/professional/weekly-availability')
      .send({
        confirmCancellations: false,
        expectedCalendarVersion: 0,
        periods,
      })
    expect(response.status).toBe(200)
    expect(response.body.periods).toHaveLength(7)
    version = response.body.calendarVersion
  })

  test('searches the professional and generates slots', async () => {
    const search = await request(app)
      .get('/v1/professionals')
      .query({ businessName })
    expect(search.status).toBe(200)
    expect(search.body.items[0].id).toBe(professionalId)

    const from = DateTime.now().plus({ days: 1 }).toISODate()
    const slots = await request(app)
      .get(`/v1/professionals/${professionalId}/slots`)
      .query({ from, timezone: 'Europe/Paris' })
    expect(slots.status).toBe(200)
    expect(slots.body.days).toHaveLength(7)
    expect(slots.body.days[0].slots.length).toBeGreaterThan(0)
  })

  test('creates and deletes an unavailability', async () => {
    const start = DateTime.now().plus({ days: 10 }).startOf('day')
    const created = await agent
      .post('/v1/professional/unavailabilities')
      .send({
        confirmCancellations: false,
        endAt: start.plus({ hours: 2 }).toUTC().toISO(),
        expectedCalendarVersion: version,
        startAt: start.toUTC().toISO(),
      })
    expect(created.status).toBe(201)
    const id = created.body.unavailability.id
    const deleted = await agent
      .delete(`/v1/professional/unavailabilities/${id}`)
      .query({ expectedCalendarVersion: created.body.calendarVersion })
    expect(deleted.status).toBe(200)
  })
})
