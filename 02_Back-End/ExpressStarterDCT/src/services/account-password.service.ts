import type { z } from 'zod'

import { prisma } from '../database/prisma'
import { AppError } from '../errors/app-error'
import type { passwordSchema } from '../schemas/account.schemas'

type PasswordInput = z.infer<typeof passwordSchema>

export const updatePassword = async (
  userId: number,
  input: PasswordInput,
) => {
  if (input.newPassword !== input.newPasswordConfirmation) {
    throw new AppError(400, 'PASSWORD_CONFIRMATION_MISMATCH')
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.password !== input.currentPassword) {
    throw new AppError(403, 'PASSWORD_INVALID')
  }
  await prisma.user.update({
    data: { password: input.newPassword },
    where: { id: userId },
  })
}
