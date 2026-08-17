import type { z } from 'zod'

import { prisma } from '../database/prisma'
import type { professionalSearchSchema } from '../schemas/calendar.schemas'

type Search = z.infer<typeof professionalSearchSchema>

export const searchProfessionals = async (input: Search) => {
  const cursorId = input.cursor ? Number(atob(input.cursor)) : undefined
  const profiles = await prisma.professionalProfile.findMany({
    orderBy: [{ businessName: 'asc' }, { userId: 'asc' }],
    take: input.limit + 1,
    where: {
      businessName: { contains: input.businessName },
      userId: cursorId ? { gt: cursorId } : undefined,
    },
  })
  const hasNext = profiles.length > input.limit
  const items = profiles.slice(0, input.limit).map((profile) => ({
    businessName: profile.businessName,
    id: profile.userId,
    timezone: profile.timezone,
  }))
  const last = items.at(-1)
  return {
    items,
    nextCursor: hasNext && last ? btoa(String(last.id)) : null,
  }
}
