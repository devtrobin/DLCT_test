import { z } from 'zod'

export const accountUpdateSchema = z
  .object({
    businessName: z.string().trim().min(1).max(150).optional(),
    email: z.string().trim().email().max(254).optional(),
    expectedCalendarVersion: z.number().int().min(0).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(1).max(30).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(255),
  newPassword: z.string().min(8).max(255),
  newPasswordConfirmation: z.string().min(8).max(255),
})

export const deletionPreviewSchema = z.object({
  password: z.string().min(1).max(255),
})

export const deletionSchema = deletionPreviewSchema.extend({
  confirm: z.literal(true),
  impactFingerprint: z.string().min(1),
})
