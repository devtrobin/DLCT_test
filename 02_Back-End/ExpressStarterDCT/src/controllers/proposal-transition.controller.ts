import type { RequestHandler } from 'express'

import {
  proposalForceSchema,
  proposalRejectionSchema,
} from '../schemas/proposal.schemas'
import { acceptProposal } from '../services/proposal-accept.service'
import { closeProposal } from '../services/proposal-close.service'
import { getVisibleAppointment } from '../services/appointment-query.service'
import { connectedPrincipal } from '../types/principal.types'

const context = async (request: Parameters<RequestHandler>[0]) => ({
  appointment: await getVisibleAppointment(
    Number(request.params.id),
    request.sessionUser!,
  ),
  principal: connectedPrincipal(request.sessionUser!),
  proposalId: Number(request.params.proposalId),
})

export const acceptProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  response.json(await acceptProposal(
    input.appointment, input.proposalId, input.principal,
  ))
}

export const rejectProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  const body = proposalRejectionSchema.parse(request.body)
  response.json(await closeProposal(
    input.appointment, input.proposalId, input.principal,
    'REJECTED', body.reason,
  ))
}

export const cancelProposalController: RequestHandler = async (
  request,
  response,
) => {
  const input = await context(request)
  response.json(await closeProposal(
    input.appointment, input.proposalId, input.principal, 'CANCELED',
  ))
}

export const forceProposalController: RequestHandler = async (
  request,
  response,
) => {
  proposalForceSchema.parse(request.body)
  const input = await context(request)
  response.json(await acceptProposal(
    input.appointment, input.proposalId, input.principal, true,
  ))
}
