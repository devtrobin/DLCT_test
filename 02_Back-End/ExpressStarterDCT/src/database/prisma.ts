import { PrismaPg } from '@prisma/adapter-pg'

import { environment } from '../config/environment'
import { PrismaClient } from '../generated/client/client.js'

const adapter = new PrismaPg({
  connectionString: environment.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })
