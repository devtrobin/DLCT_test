import { DateTime } from 'luxon'

import { AppError } from '../errors/app-error'
import { minuteFromTime } from './time.service'

export type WeeklyPeriod = {
  weekday: number
  startMinute: number
  endMinute: number
}

type PeriodInput = {
  weekday: number
  startTime: string
  endTime: string
}

export const normalizePeriods = (input: PeriodInput[]): WeeklyPeriod[] =>
  input.map((period) => ({
    endMinute: minuteFromTime(period.endTime),
    startMinute: minuteFromTime(period.startTime),
    weekday: period.weekday,
  }))

export const validatePeriods = (periods: WeeklyPeriod[]) => {
  const sorted = [...periods].sort((a, b) =>
    a.weekday - b.weekday || a.startMinute - b.startMinute,
  )
  sorted.forEach((period, index) => {
    if (period.startMinute >= period.endMinute) {
      throw new AppError(400, 'INVALID_INTERVAL')
    }
    const previous = sorted[index - 1]
    if (previous?.weekday === period.weekday
      && previous.endMinute > period.startMinute) {
      throw new AppError(409, 'WEEKLY_AVAILABILITY_CONFLICT')
    }
  })
}

export const isCoveredByPeriods = (
  startAt: Date,
  timezone: string,
  periods: WeeklyPeriod[],
) => {
  const localStart = DateTime.fromJSDate(startAt, { zone: timezone })
  const startMinute = localStart.hour * 60 + localStart.minute
  return periods.some((period) =>
    period.weekday === localStart.weekday
    && period.startMinute <= startMinute
    && period.endMinute >= startMinute + 60,
  )
}
