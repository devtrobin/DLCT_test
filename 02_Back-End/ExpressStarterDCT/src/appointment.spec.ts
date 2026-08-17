import { afterAll, describe, expect, test } from 'bun:test'
import { DateTime } from 'luxon'
import request from 'supertest'

import app from './app'
import { prisma } from './database/prisma'

const suffix = Date.now()
const clientEmail = `booking-client-${suffix}@example.test`
const professionalEmail = `booking-pro-${suffix}@example.test`
const clientAgent = request.agent(app)
const professionalAgent = request.agent(app)
const start = DateTime.now().setZone('Europe/Paris')
  .plus({ days: 2 }).startOf('day').plus({ hours: 10 })
let professionalId = 0
let appointmentId = 0

const registration = (role: 'CLIENT' | 'PROFESSIONAL') => ({
  businessName: role === 'PROFESSIONAL' ? `Booking ${suffix}` : undefined,
  email: role === 'CLIENT' ? clientEmail : professionalEmail,
  firstName: 'Test',
  lastName: role,
  password: 'Password',
  phone: '+33000000000',
  role,
  timezone: 'Europe/Paris',
})

afterAll(async () => {
  await prisma.appointment.deleteMany({
    where: { OR: [{ clientEmail }, { clientEmail: 'guest@example.test' }] },
  })
  await prisma.user.deleteMany({
    where: { email: { in: [clientEmail, professionalEmail] } },
  })
  await prisma.$disconnect()
})

describe('appointments', () => {
  test('prepares client, professional and availability', async () => {
    await clientAgent.post('/auth/register').send(registration('CLIENT'))
    const professional = await professionalAgent
      .post('/auth/register').send(registration('PROFESSIONAL'))
    professionalId = professional.body.user.id
    const schedule = await professionalAgent
      .put('/v1/professional/weekly-availability')
      .send({
        confirmCancellations: false,
        expectedCalendarVersion: 0,
        periods: [{
          endTime: '18:00',
          startTime: '09:00',
          weekday: start.weekday,
        }],
      })
    expect(schedule.status).toBe(200)
  })

  test('books, lists and cancels a client appointment', async () => {
    const booking = await clientAgent.post('/v1/appointments').send({
      professionalId,
      startAt: start.toUTC().toISO(),
    })
    expect(booking.status).toBe(201)
    expect(booking.body.publicCode).toBeString()
    appointmentId = booking.body.id

    const list = await clientAgent.get('/v1/appointments')
    expect(list.status).toBe(200)
    expect(list.body.items[0].id).toBe(appointmentId)

    const canceled = await clientAgent
      .post(`/v1/appointments/${appointmentId}/cancel`).send({})
    expect(canceled.status).toBe(200)
    expect(canceled.body.status).toBe('CANCELED')
  })

  test('allows a professional to create a manual appointment', async () => {
    const response = await professionalAgent
      .post('/v1/professional/appointments')
      .send({
        client: {
          email: 'guest@example.test',
          firstName: 'Guest',
          lastName: 'Client',
          phone: '+33000000001',
        },
        startAt: start.plus({ weeks: 1 }).toUTC().toISO(),
      })
    expect(response.status).toBe(201)
    expect(response.body.clientLinked).toBe(false)
  })
})
