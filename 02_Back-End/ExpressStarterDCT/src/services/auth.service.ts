import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type {
  loginSchema,
  recoverySchema,
  registrationSchema,
} from '../schemas/auth.schemas'
import type { z } from 'zod'
import { createSession } from './session.service'

type Registration = z.infer<typeof registrationSchema>
type Login = z.infer<typeof loginSchema>
type Recovery = z.infer<typeof recoverySchema>

export const register = async (input: Registration) => {
  const existing = await prisma.user.findUnique({
    where: { role_email: { email: input.email, role: input.role } },
  })
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_USED')

  if (input.role === 'PROFESSIONAL') {
    const business = await prisma.professionalProfile.findUnique({
      where: { businessName: input.businessName },
    })
    if (business) throw new AppError(409, 'BUSINESS_NAME_ALREADY_USED')
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: input.password,
      role: input.role,
      clientProfile: input.role === 'CLIENT' ? {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          preferredTimezone: input.timezone,
        },
      } : undefined,
      professionalProfile: input.role === 'PROFESSIONAL' ? {
        create: {
          businessName: input.businessName,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          timezone: input.timezone,
        },
      } : undefined,
    },
  })
  return createSession(user.id, false)
}

export const login = async (input: Login) => {
  const user = await prisma.user.findUnique({
    where: { role_email: { email: input.email, role: input.role } },
  })
  if (!user || user.password !== input.password) {
    throw new AppError(401, 'INVALID_CREDENTIALS')
  }
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return createSession(user.id, input.rememberMe)
}

export const recoverPassword = async (input: Recovery) => {
  const user = await prisma.user.findUnique({
    where: { role_email: { email: input.email, role: input.role } },
  })
  if (!user) throw new AppError(404, 'ACCOUNT_NOT_FOUND')
  return { password: user.password, warning: 'DEMO_PLAINTEXT_PASSWORD' }
}
