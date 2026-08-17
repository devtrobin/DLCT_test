import { DateTime } from 'luxon'

import { AppError } from '../errors/app-error'

export const assertTimezone = (timezone: string) => {
  if (!DateTime.now().setZone(timezone).isValid) {
    throw new AppError(400, 'INVALID_TIMEZONE')
  }
}

export const minuteFromTime = (time: string) => {
  if (time === '24:00') return 1_440
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const timeFromMinute = (minute: number) => {
  if (minute === 1_440) return '24:00'
  const hours = String(Math.floor(minute / 60)).padStart(2, '0')
  const minutes = String(minute % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const rangeView = (startAt: Date, endAt: Date) => ({
  endAt: endAt.toISOString(),
  startAt: startAt.toISOString(),
})
