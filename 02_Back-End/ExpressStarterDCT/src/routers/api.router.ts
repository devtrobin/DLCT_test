import { Router } from 'express'

import {
  deleteAccountController,
  deletionPreviewController,
  getAccountController,
  updateAccountController,
  updatePasswordController,
} from '../controllers/account.controller'
import {
  createUnavailabilityController,
  deleteUnavailabilityController,
  replaceWeeklyController,
  unavailabilityListController,
  weeklyController,
} from '../controllers/calendar.controller'
import {
  appointmentDetailController,
  cancelAppointmentController,
  createAppointmentController,
  createManualAppointmentController,
  listAppointmentsController,
} from '../controllers/appointment.controller'
import {
  createProposalController,
  proposalSlotsController,
} from '../controllers/proposal.controller'
import {
  acceptProposalController,
  cancelProposalController,
  forceProposalController,
  rejectProposalController,
} from '../controllers/proposal-transition.controller'
import { requireRole, requireSession } from '../middleware/session.middleware'
import { notificationRouter } from './notification.router'

export const apiRouter = Router()

apiRouter.use(requireSession)
apiRouter.get('/account', getAccountController)
apiRouter.patch('/account', updateAccountController)
apiRouter.patch('/account/password', updatePasswordController)
apiRouter.post('/account/deletion-preview', deletionPreviewController)
apiRouter.delete('/account', deleteAccountController)

apiRouter.use('/notifications', notificationRouter)

apiRouter.post(
  '/appointments',
  requireRole('CLIENT'),
  createAppointmentController,
)
apiRouter.get('/appointments', listAppointmentsController)
apiRouter.get('/appointments/:id', appointmentDetailController)
apiRouter.post('/appointments/:id/cancel', cancelAppointmentController)
apiRouter.get('/appointments/:id/proposal-slots', proposalSlotsController)
apiRouter.post('/appointments/:id/proposals', createProposalController)
apiRouter.post(
  '/appointments/:id/proposals/:proposalId/accept',
  acceptProposalController,
)
apiRouter.post(
  '/appointments/:id/proposals/:proposalId/reject',
  rejectProposalController,
)
apiRouter.post(
  '/appointments/:id/proposals/:proposalId/cancel',
  cancelProposalController,
)
apiRouter.post(
  '/appointments/:id/proposals/:proposalId/force',
  forceProposalController,
)

apiRouter.use('/professional', requireRole('PROFESSIONAL'))
apiRouter.post(
  '/professional/appointments',
  createManualAppointmentController,
)
apiRouter.get('/professional/weekly-availability', weeklyController)
apiRouter.put(
  '/professional/weekly-availability',
  replaceWeeklyController,
)
apiRouter.get(
  '/professional/unavailabilities',
  unavailabilityListController,
)
apiRouter.post(
  '/professional/unavailabilities',
  createUnavailabilityController,
)
apiRouter.delete(
  '/professional/unavailabilities/:id',
  deleteUnavailabilityController,
)
