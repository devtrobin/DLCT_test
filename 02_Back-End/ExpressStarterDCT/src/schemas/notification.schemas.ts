import { z } from 'zod'

export const notificationListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.string().transform((value) => value === 'true')
    .default(false),
})
