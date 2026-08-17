import { z } from 'zod'

const role = z.enum(['CLIENT', 'PROFESSIONAL'])
const email = z.string().trim().email().max(254)
const name = z.string().trim().min(1).max(100)
const phone = z.string().trim().min(1).max(30)
const timezone = z.string().trim().min(1).max(64)

const sharedRegistration = {
  email,
  firstName: name,
  lastName: name,
  password: z.string().min(8).max(255),
  phone,
  timezone,
}

export const registrationSchema = z.discriminatedUnion('role', [
  z.object({ ...sharedRegistration, role: z.literal('CLIENT') }),
  z.object({
    ...sharedRegistration,
    businessName: z.string().trim().min(1).max(150),
    role: z.literal('PROFESSIONAL'),
  }),
])

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(255),
  rememberMe: z.boolean().default(false),
  role,
})

export const recoverySchema = z.object({ email, role })
