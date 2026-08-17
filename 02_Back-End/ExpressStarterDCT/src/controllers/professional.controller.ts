import type { RequestHandler } from 'express'

import {
  professionalSearchSchema,
  slotSearchSchema,
} from '../schemas/calendar.schemas'
import { searchProfessionals } from '../services/professional.service'
import { generateSlots } from '../services/slot.service'

export const searchProfessionalsController: RequestHandler = async (
  request,
  response,
) => {
  response.json(await searchProfessionals(
    professionalSearchSchema.parse(request.query),
  ))
}

export const slotsController: RequestHandler = async (request, response) => {
  const query = slotSearchSchema.parse(request.query)
  response.json(await generateSlots(
    Number(request.params.id),
    query.from,
    query.timezone,
  ))
}
