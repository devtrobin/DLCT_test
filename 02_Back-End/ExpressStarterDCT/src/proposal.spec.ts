import { afterAll, describe, expect, test } from 'bun:test'
import { DateTime } from 'luxon'
import request from 'supertest'

import app from './app'
import { prisma } from './database/prisma'

const suffix = Date.now()
const clientEmail = `proposal-client-${suffix}@example.test`
const proEmail = `proposal-pro-${suffix}@example.test`
const client = request.agent(app)
const professional = request.agent(app)
const start = DateTime.now().setZone('Europe/Paris')
  .plus({ days: 3 }).startOf('day').plus({ hours: 10 })
let appointmentId = 0
let publicCode = ''

const register = (role: 'CLIENT' | 'PROFESSIONAL') => ({
  businessName: role === 'PROFESSIONAL' ? `Proposal ${suffix}` : undefined,
  email: role === 'CLIENT' ? clientEmail : proEmail,
  firstName: 'Proposal',
  lastName: role,
  password: 'Password',
  phone: '+33000000000',
  role,
  timezone: 'Europe/Paris',
})

afterAll(async () => {
  await prisma.appointment.deleteMany({ where: { clientEmail } })
  await prisma.user.deleteMany({
    where: { email: { in: [clientEmail, proEmail] } },
  })
  await prisma.$disconnect()
})

describe('appointment proposals and public access', () => {
  test('creates the appointment fixture', async () => {
    await client.post('/auth/register').send(register('CLIENT'))
    const pro = await professional
      .post('/auth/register').send(register('PROFESSIONAL'))
    const professionalId = pro.body.user.id
    await professional.put('/v1/professional/weekly-availability').send({
      confirmCancellations: false,
      expectedCalendarVersion: 0,
      periods: [{
        endTime: '18:00',
        startTime: '09:00',
        weekday: start.weekday,
      }],
    })
    const booking = await client.post('/v1/appointments').send({
      professionalId,
      startAt: start.toUTC().toISO(),
    })
    appointmentId = booking.body.id
    publicCode = booking.body.publicCode
    expect(booking.status).toBe(201)
  })

  test('lets the client propose and professional accept', async () => {
    const proposed = await client
      .post(`/v1/appointments/${appointmentId}/proposals`)
      .send({ proposedStartAt: start.plus({ hours: 1 }).toUTC().toISO() })
    expect(proposed.status).toBe(201)
    const path = `/v1/appointments/${appointmentId}`
      + `/proposals/${proposed.body.id}/accept`
    const accepted = await professional
      .post(path)
    expect(accepted.status).toBe(200)
    expect(accepted.body.proposal.status).toBe('ACCEPTED')
  })

  test('exposes only the safe public appointment projection', async () => {
    const response = await request(app)
      .get('/v1/public/appointment')
      .set('X-Public-Code', publicCode)
    expect(response.status).toBe(200)
    expect(response.body.client).toBeUndefined()
    expect(response.body.publicCode).toBeUndefined()
  })
})
