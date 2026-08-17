import { Router } from 'express'

import {
  deleteAccountController,
  deletionPreviewController,
  getAccountController,
  updateAccountController,
  updatePasswordController,
} from '../controllers/account.controller'
import { requireSession } from '../middleware/session.middleware'

export const apiRouter = Router()

apiRouter.use(requireSession)
apiRouter.get('/account', getAccountController)
apiRouter.patch('/account', updateAccountController)
apiRouter.patch('/account/password', updatePasswordController)
apiRouter.post('/account/deletion-preview', deletionPreviewController)
apiRouter.delete('/account', deleteAccountController)
