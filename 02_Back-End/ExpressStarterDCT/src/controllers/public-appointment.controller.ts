import type { RequestHandler } from 'express'

import { cancellationSchema } from '../schemas/appointment.schemas'
import { slotSearchSchema } from '../schemas/calendar.schemas'
import { proposalCreationSchema } from '../schemas/proposal.schemas'
import { createProposal } from '../services/proposal-create.service'
import { readPublicCode } from '../services/public-code.service'
import { cancelPublicAppointment } from '../services/public-cancel.service'
import {
  getPublicAppointmentRecord,
  projectPublicAppointment,
} from '../services/public-appointment.service'
import { generateSlots } from '../services/slot.service'
import { publicPrincipal } from '../types/principal.types'

export const publicAppointmentController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getPublicAppointmentRecord(readPublicCode(request))
  response.json(projectPublicAppointment(appointment))
}

export const publicCancelController: RequestHandler = async (
  request,
  response,
) => {
  const body = cancellationSchema.parse(request.body)
  response.json(await cancelPublicAppointment(
    readPublicCode(request),
    body.reason,
  ))
}

export const publicProposalSlotsController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getPublicAppointmentRecord(readPublicCode(request))
  const query = slotSearchSchema.parse(request.query)
  response.json(await generateSlots(
    appointment.professionalUserId!,
    query.from,
    query.timezone,
    appointment.id,
  ))
}

export const publicCreateProposalController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getPublicAppointmentRecord(readPublicCode(request))
  const body = proposalCreationSchema.parse(request.body)
  response.status(201).json(await createProposal(
    appointment,
    publicPrincipal,
    new Date(body.proposedStartAt),
  ))
}
