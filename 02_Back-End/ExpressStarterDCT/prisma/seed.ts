import { PrismaPg } from '@prisma/adapter-pg'

import {
  PrismaClient,
  UserRole,
} from '../src/generated/client/client.js'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })
const clientEmail = 'client@example.test'
const professionalEmail = 'restaurant@example.test'

const client = await prisma.user.upsert({
  create: {
    email: clientEmail,
    password: 'Password',
    role: UserRole.CLIENT,
  },
  update: {},
  where: {
    role_email: { email: clientEmail, role: UserRole.CLIENT },
  },
})

await prisma.clientProfile.upsert({
  create: {
    firstName: 'Camille',
    lastName: 'Client',
    phone: '0600000001',
    preferredTimezone: 'Europe/Paris',
    userId: client.id,
  },
  update: {},
  where: { userId: client.id },
})

const professional = await prisma.user.upsert({
  create: {
    email: professionalEmail,
    password: 'Password',
    role: UserRole.PROFESSIONAL,
  },
  update: {},
  where: {
    role_email: {
      email: professionalEmail,
      role: UserRole.PROFESSIONAL,
    },
  },
})

await prisma.professionalProfile.upsert({
  create: {
    businessName: 'Restaurant Démo',
    firstName: 'Sophie',
    lastName: 'Restauratrice',
    phone: '0600000002',
    timezone: 'Europe/Paris',
    userId: professional.id,
  },
  update: {},
  where: { userId: professional.id },
})

await prisma.$disconnect()
