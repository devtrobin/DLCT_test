import type { RequestHandler } from 'express'

import {
  calendarVersionSchema,
  unavailabilityCreationSchema,
  unavailabilityQuerySchema,
  weeklyAvailabilitySchema,
} from '../schemas/calendar.schemas'
import {
  getUnavailabilities,
  getWeeklyAvailability,
} from '../services/calendar-query.service'
import {
  createUnavailability,
} from '../services/unavailability.service'
import { deleteUnavailability } from '../services/unavailability-delete.service'
import {
  replaceWeeklyAvailability,
} from '../services/weekly-availability.service'

export const weeklyController: RequestHandler = async (request, response) => {
  response.json(await getWeeklyAvailability(request.sessionUser!.id))
}

export const replaceWeeklyController: RequestHandler = async (
  request,
  response,
) => {
  const input = weeklyAvailabilitySchema.parse(request.body)
  response.json(await replaceWeeklyAvailability(request.sessionUser!.id, input))
}

export const unavailabilityListController: RequestHandler = async (
  request,
  response,
) => {
  const query = unavailabilityQuerySchema.parse(request.query)
  response.json(await getUnavailabilities(
    request.sessionUser!.id,
    query.from,
    query.to,
  ))
}

export const createUnavailabilityController: RequestHandler = async (
  request,
  response,
) => {
  const input = unavailabilityCreationSchema.parse(request.body)
  const result = await createUnavailability(request.sessionUser!.id, input)
  response.status(201).json(result)
}

export const deleteUnavailabilityController: RequestHandler = async (
  request,
  response,
) => {
  const query = calendarVersionSchema.parse(request.query)
  response.json(await deleteUnavailability(
    request.sessionUser!.id,
    Number(request.params.id),
    query.expectedCalendarVersion,
  ))
}
