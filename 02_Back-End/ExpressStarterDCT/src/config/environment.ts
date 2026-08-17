import { z } from 'zod'

const environmentSchema = z.object({
  APP_NAME: z.string().min(1).default('delicity'),
  COOKIE_DOMAIN: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PERSISTENT_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
})

export const environment = environmentSchema.parse(process.env)

export const corsOrigins = environment.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
