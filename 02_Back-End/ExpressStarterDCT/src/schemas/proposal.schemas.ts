import { z } from 'zod'

export const proposalCreationSchema = z.object({
  proposedStartAt: z.string().datetime({ offset: true }),
})

export const proposalRejectionSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
})

export const proposalForceSchema = z.object({ confirm: z.literal(true) })

export const publicCodeSchema = z.string()
  .min(22)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)
