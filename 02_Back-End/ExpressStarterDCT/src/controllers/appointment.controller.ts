import type { RequestHandler } from 'express'

import {
  cancellationSchema,
  clientAppointmentListSchema,
  clientAppointmentSchema,
  manualAppointmentSchema,
  professionalAgendaSchema,
} from '../schemas/appointment.schemas'
import { cancelAppointment } from '../services/appointment-cancel.service'
import {
  listClientAppointments,
  listProfessionalAgenda,
} from '../services/appointment-list.service'
import {
  getVisibleAppointment,
} from '../services/appointment-query.service'
import { projectAppointment } from '../services/appointment-projector'
import { createClientBooking } from '../services/client-booking.service'
import { createManualBooking } from '../services/manual-booking.service'

export const createAppointmentController: RequestHandler = async (
  request,
  response,
) => {
  const input = clientAppointmentSchema.parse(request.body)
  response.status(201).json(await createClientBooking(
    request.sessionUser!.id,
    input,
  ))
}

export const createManualAppointmentController: RequestHandler = async (
  request,
  response,
) => {
  const input = manualAppointmentSchema.parse(request.body)
  response.status(201).json(await createManualBooking(
    request.sessionUser!.id,
    input,
  ))
}

export const listAppointmentsController: RequestHandler = async (
  request,
  response,
) => {
  const user = request.sessionUser!
  if (user.role === 'CLIENT') {
    const query = clientAppointmentListSchema.parse(request.query)
    response.json(await listClientAppointments(user.id, query))
    return
  }
  const query = professionalAgendaSchema.parse(request.query)
  response.json(await listProfessionalAgenda(
    user.id,
    query.from,
    query.includeCanceled,
  ))
}

export const appointmentDetailController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getVisibleAppointment(
    Number(request.params.id),
    request.sessionUser!,
  )
  response.json(projectAppointment(appointment))
}

export const cancelAppointmentController: RequestHandler = async (
  request,
  response,
) => {
  const input = cancellationSchema.parse(request.body)
  response.json(await cancelAppointment(
    Number(request.params.id),
    request.sessionUser!,
    input.reason,
  ))
}
