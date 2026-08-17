import type { Request, RequestHandler } from 'express'

import { proposalRejectionSchema } from '../schemas/proposal.schemas'
import { acceptProposal } from '../services/proposal-accept.service'
import { closeProposal } from '../services/proposal-close.service'
import { readPublicCode } from '../services/public-code.service'
import {
  getPublicAppointmentRecord,
  projectPublicAppointment,
} from '../services/public-appointment.service'
import { publicPrincipal } from '../types/principal.types'

const context = async (request: Request) => ({
  appointment: await getPublicAppointmentRecord(readPublicCode(request)),
  proposalId: Number(request.params.proposalId),
})

export const publicAcceptProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  const accepted = await acceptProposal(
    input.appointment, input.proposalId, publicPrincipal,
  )
  const appointment = await getPublicAppointmentRecord(readPublicCode(request))
  response.json({
    appointment: projectPublicAppointment(appointment),
    proposal: accepted.proposal,
  })
}

export const publicRejectProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  const body = proposalRejectionSchema.parse(request.body)
  response.json(await closeProposal(
    input.appointment, input.proposalId, publicPrincipal,
    'REJECTED', body.reason,
  ))
}

export const publicCancelProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  response.json(await closeProposal(
    input.appointment, input.proposalId, publicPrincipal, 'CANCELED',
  ))
}
