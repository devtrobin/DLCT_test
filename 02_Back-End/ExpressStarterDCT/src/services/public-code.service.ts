import type { Request } from 'express'

import { AppError } from '../errors/app-error'
import { publicCodeSchema } from '../schemas/proposal.schemas'

export const readPublicCode = (request: Request) => {
  const header = request.header('X-Public-Code')
  if (!header) throw new AppError(400, 'PUBLIC_CODE_REQUIRED')
  const result = publicCodeSchema.safeParse(header)
  if (!result.success) {
    throw new AppError(404, 'PUBLIC_APPOINTMENT_NOT_FOUND')
  }
  return result.data
}
