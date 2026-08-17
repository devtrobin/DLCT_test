import { api } from './http'
import type { Professional, SlotDay } from '../types/api'

export const searchProfessionals = (businessName: string) => api<{
  items: Professional[]
}>('/v1/professionals?' + new URLSearchParams({ businessName }))

export const getSlots = (
  professionalId: number,
  from: string,
  timezone: string,
) => api<{
  days: SlotDay[]
  professional: Professional
  timezone: string
}>(`/v1/professionals/${professionalId}/slots?` + new URLSearchParams({
  from,
  timezone,
}))

export const getWeekly = () => api<{
  calendarVersion: number
  timezone: string
  periods: Array<{
    id: number
    weekday: number
    startTime: string
    endTime: string
  }>
}>('/v1/professional/weekly-availability')

export const replaceWeekly = (
  calendarVersion: number,
  periods: Array<{
    weekday: number
    startTime: string
    endTime: string
  }>,
  confirmCancellations = false,
  impactFingerprint?: string,
) => api('/v1/professional/weekly-availability', {
  body: JSON.stringify({
    confirmCancellations,
    expectedCalendarVersion: calendarVersion,
    impactFingerprint,
    periods,
  }),
  method: 'PUT',
})

export const getUnavailabilities = () => api<{
  calendarVersion: number
  items: Array<{
    id: number
    range: { startAt: string; endAt: string }
    reason: string | null
  }>
}>('/v1/professional/unavailabilities')

export const createUnavailability = (body: Record<string, unknown>) => api(
  '/v1/professional/unavailabilities',
  { body: JSON.stringify(body), method: 'POST' },
)

export const deleteUnavailability = (id: number, version: number) => api<{
  calendarVersion: number
}>(`/v1/professional/unavailabilities/${id}?` + new URLSearchParams({
  expectedCalendarVersion: String(version),
}), { method: 'DELETE' })
