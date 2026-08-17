import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import { projectUser } from './user-projector'

const include = {
  clientProfile: true,
  professionalProfile: true,
} as const

export const getAccount = async (userId: number) => {
  const user = await prisma.user.findUnique({ include, where: { id: userId } })
  if (!user) throw new AppError(404, 'ACCOUNT_NOT_FOUND')
  return projectUser(user)
}
