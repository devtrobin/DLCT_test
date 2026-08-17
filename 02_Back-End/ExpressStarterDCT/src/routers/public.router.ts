import { Router } from 'express'

import {
  searchProfessionalsController,
  slotsController,
} from '../controllers/professional.controller'
import {
  publicAppointmentController,
  publicCancelController,
  publicCreateProposalController,
  publicProposalSlotsController,
} from '../controllers/public-appointment.controller'
import {
  publicAcceptProposalController,
  publicCancelProposalController,
  publicRejectProposalController,
} from '../controllers/public-proposal.controller'

export const publicRouter = Router()

publicRouter.get('/professionals', searchProfessionalsController)
publicRouter.get('/professionals/:id/slots', slotsController)
publicRouter.get('/public/appointment', publicAppointmentController)
publicRouter.post('/public/appointment/cancel', publicCancelController)
publicRouter.get(
  '/public/appointment/proposal-slots',
  publicProposalSlotsController,
)
publicRouter.post(
  '/public/appointment/proposals',
  publicCreateProposalController,
)
publicRouter.post(
  '/public/appointment/proposals/:proposalId/accept',
  publicAcceptProposalController,
)
publicRouter.post(
  '/public/appointment/proposals/:proposalId/reject',
  publicRejectProposalController,
)
publicRouter.post(
  '/public/appointment/proposals/:proposalId/cancel',
  publicCancelProposalController,
)
