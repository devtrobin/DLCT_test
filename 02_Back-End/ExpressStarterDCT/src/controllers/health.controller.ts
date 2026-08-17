import type { NextFunction, Request, Response } from 'express'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'

export async function healthController(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({
      database: 'up',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch {
    next(new AppError(503, 'DATABASE_UNAVAILABLE'))
  }
}
