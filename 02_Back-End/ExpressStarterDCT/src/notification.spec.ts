import { afterAll, describe, expect, test } from 'bun:test'
import request from 'supertest'

import app from './app'
import { prisma } from './database/prisma'

const email = `notification-${Date.now()}@example.test`
const agent = request.agent(app)
let userId = 0
let notificationId = 0

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
})

describe('internal notifications', () => {
  test('creates the account and notification fixture', async () => {
    const registration = await agent.post('/auth/register').send({
      email,
      firstName: 'Notification',
      lastName: 'Client',
      password: 'Password',
      phone: '+33000000000',
      role: 'CLIENT',
      timezone: 'Europe/Paris',
    })
    userId = registration.body.user.id
    const notification = await prisma.inAppNotification.create({
      data: {
        eventKey: `test:${Date.now()}`,
        payload: { actor: 'SYSTEM' },
        recipientUserId: userId,
        type: 'APPOINTMENT_CREATED',
      },
    })
    notificationId = notification.id
  })

  test('lists and counts unread notifications', async () => {
    const list = await agent.get('/v1/notifications')
    expect(list.status).toBe(200)
    expect(list.body.items[0].id).toBe(notificationId)
    const count = await agent.get('/v1/notifications/unread-count')
    expect(count.body.count).toBe(1)
  })

  test('marks one or all notifications as read', async () => {
    const read = await agent.patch(`/v1/notifications/${notificationId}/read`)
    expect(read.status).toBe(200)
    expect(read.body.readAt).toBeString()
    const all = await agent.post('/v1/notifications/read-all')
    expect(all.body.count).toBe(0)
  })
})
