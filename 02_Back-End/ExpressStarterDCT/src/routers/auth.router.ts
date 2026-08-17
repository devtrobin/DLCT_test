import { Router } from 'express'

import {
  loginController,
  logoutController,
  recoveryController,
  registerController,
  sessionController,
} from '../controllers/auth.controller'

export const authRouter = Router()

authRouter.post('/register', registerController)
authRouter.post('/login', loginController)
authRouter.post('/logout', logoutController)
authRouter.get('/session', sessionController)
authRouter.post('/demo-password-recovery', recoveryController)
