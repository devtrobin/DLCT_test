import { z } from 'zod'

const instant = z.string().datetime({ offset: true })

export const clientAppointmentSchema = z.object({
  professionalId: z.number().int().positive(),
  startAt: instant,
})

export const manualAppointmentSchema = z.object({
  client: z.object({
    email: z.string().trim().email().max(254),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(1).max(30),
  }),
  startAt: instant,
})

export const cancellationSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
})

export const clientAppointmentListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  timezone: z.string().optional(),
  view: z.enum(['UPCOMING', 'HISTORY']).default('UPCOMING'),
})

export const professionalAgendaSchema = z.object({
  from: z.string().date(),
  includeCanceled: z.string().transform((value) => value === 'true')
    .default(false),
})
