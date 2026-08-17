import { Router } from 'express'

import {
  searchProfessionalsController,
  slotsController,
} from '../controllers/professional.controller'

export const publicRouter = Router()

publicRouter.get('/professionals', searchProfessionalsController)
publicRouter.get('/professionals/:id/slots', slotsController)
