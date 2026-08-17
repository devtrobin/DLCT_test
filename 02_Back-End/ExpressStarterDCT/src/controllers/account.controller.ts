import type { RequestHandler } from 'express'

import {
  accountUpdateSchema,
  deletionPreviewSchema,
  deletionSchema,
  passwordSchema,
} from '../schemas/account.schemas'
import {
  deleteAccount,
  previewDeletion,
} from '../services/account-deletion.service'
import { updatePassword } from '../services/account-password.service'
import { getAccount } from '../services/account-query.service'
import { updateAccount } from '../services/account-update.service'
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../services/session.service'

export const getAccountController: RequestHandler = async (
  request,
  response,
) => {
  response.json(await getAccount(request.sessionUser!.id))
}

export const updateAccountController: RequestHandler = async (
  request,
  response,
) => {
  const input = accountUpdateSchema.parse(request.body)
  const user = request.sessionUser!
  response.json(await updateAccount(user.id, user.role, input))
}

export const updatePasswordController: RequestHandler = async (
  request,
  response,
) => {
  await updatePassword(
    request.sessionUser!.id,
    passwordSchema.parse(request.body),
  )
  response.status(204).send()
}

export const deletionPreviewController: RequestHandler = async (
  request,
  response,
) => {
  const input = deletionPreviewSchema.parse(request.body)
  response.json(await previewDeletion(request.sessionUser!.id, input.password))
}

export const deleteAccountController: RequestHandler = async (
  request,
  response,
) => {
  const input = deletionSchema.parse(request.body)
  await deleteAccount(
    request.sessionUser!.id,
    input.password,
    input.impactFingerprint,
  )
  response.clearCookie(SESSION_COOKIE, sessionCookieOptions())
  response.status(204).send()
}
