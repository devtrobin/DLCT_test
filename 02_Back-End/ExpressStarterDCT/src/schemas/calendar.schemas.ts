import { z } from 'zod'

const localTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const instant = z.string().datetime({ offset: true })

export const professionalSearchSchema = z.object({
  businessName: z.string().trim().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const slotSearchSchema = z.object({
  from: z.string().date(),
  timezone: z.string().trim().min(1).max(64),
})

export const weeklyAvailabilitySchema = z.object({
  confirmCancellations: z.boolean(),
  expectedCalendarVersion: z.number().int().min(0),
  impactFingerprint: z.string().optional(),
  periods: z.array(z.object({
    endTime: z.union([localTime, z.literal('24:00')]),
    startTime: localTime,
    weekday: z.number().int().min(1).max(7),
  })),
})

export const unavailabilityQuerySchema = z.object({
  from: instant.optional(),
  to: instant.optional(),
}).refine((value) => !value.from || !value.to || value.from < value.to)

export const unavailabilityCreationSchema = z.object({
  confirmCancellations: z.boolean(),
  endAt: instant,
  expectedCalendarVersion: z.number().int().min(0),
  impactFingerprint: z.string().optional(),
  reason: z.string().trim().min(1).max(500).optional(),
  startAt: instant,
}).refine((value) => value.startAt < value.endAt)

export const calendarVersionSchema = z.object({
  expectedCalendarVersion: z.coerce.number().int().min(0),
})
