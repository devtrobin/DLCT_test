import type { RequestHandler } from 'express'

import { slotSearchSchema } from '../schemas/calendar.schemas'
import { proposalCreationSchema } from '../schemas/proposal.schemas'
import { getVisibleAppointment } from '../services/appointment-query.service'
import { createProposal } from '../services/proposal-create.service'
import { generateSlots } from '../services/slot.service'
import { connectedPrincipal } from '../types/principal.types'

export const proposalSlotsController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getVisibleAppointment(
    Number(request.params.id),
    request.sessionUser!,
  )
  const query = slotSearchSchema.parse(request.query)
  response.json(await generateSlots(
    appointment.professionalUserId!,
    query.from,
    query.timezone,
    appointment.id,
  ))
}

export const createProposalController: RequestHandler = async (
  request,
  response,
) => {
  const appointment = await getVisibleAppointment(
    Number(request.params.id),
    request.sessionUser!,
  )
  const input = proposalCreationSchema.parse(request.body)
  response.status(201).json(await createProposal(
    appointment,
    connectedPrincipal(request.sessionUser!),
    new Date(input.proposedStartAt),
  ))
}
