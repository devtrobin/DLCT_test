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
import { requireRole, requireSession } from '../middleware/session.middleware'

export const apiRouter = Router()

apiRouter.use(requireSession)
apiRouter.get('/account', getAccountController)
apiRouter.patch('/account', updateAccountController)
apiRouter.patch('/account/password', updatePasswordController)
apiRouter.post('/account/deletion-preview', deletionPreviewController)
apiRouter.delete('/account', deleteAccountController)

apiRouter.post(
  '/appointments',
  requireRole('CLIENT'),
  createAppointmentController,
)
apiRouter.get('/appointments', listAppointmentsController)
apiRouter.get('/appointments/:id', appointmentDetailController)
apiRouter.post('/appointments/:id/cancel', cancelAppointmentController)

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
