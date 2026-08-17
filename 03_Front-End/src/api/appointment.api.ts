import { api } from './http'
import type { Appointment } from '../types/api'

export const book = (professionalId: number, startAt: string) =>
  api<Appointment>('/v1/appointments', {
    body: JSON.stringify({ professionalId, startAt }),
    method: 'POST',
  })

export const createManual = (body: Record<string, unknown>) =>
  api<{ appointment: Appointment; clientLinked: boolean }>(
    '/v1/professional/appointments',
    { body: JSON.stringify(body), method: 'POST' },
  )

export const listClient = (view = 'UPCOMING') => api<{
  items: Appointment[]
}>(`/v1/appointments?view=${view}`)

export const agenda = (from: string) => api<{
  days: Array<{ localDate: string; appointments: Appointment[] }>
  timezone: string
}>(`/v1/appointments?from=${from}`)

export const getAppointment = (id: number) =>
  api<Appointment>(`/v1/appointments/${id}`)

export const cancelAppointment = (id: number, reason?: string) =>
  api<Appointment>(`/v1/appointments/${id}/cancel`, {
    body: JSON.stringify({ reason }),
    method: 'POST',
  })

export const getPublicAppointment = (code: string) => api<Appointment>(
  '/v1/public/appointment',
  { headers: { 'X-Public-Code': code } },
)

export const cancelPublicAppointment = (code: string) => api<Appointment>(
  '/v1/public/appointment/cancel',
  { headers: { 'X-Public-Code': code }, method: 'POST' },
)

export const proposePublicChange = (
  code: string,
  proposedStartAt: string,
) => api('/v1/public/appointment/proposals', {
  body: JSON.stringify({ proposedStartAt }),
  headers: { 'X-Public-Code': code },
  method: 'POST',
})

export const transitionPublicProposal = (
  code: string,
  proposalId: number,
  action: 'accept' | 'reject' | 'cancel',
) => api(`/v1/public/appointment/proposals/${proposalId}/${action}`, {
  headers: { 'X-Public-Code': code },
  method: 'POST',
})

export const proposeChange = (id: number, proposedStartAt: string) => api(
  `/v1/appointments/${id}/proposals`,
  { body: JSON.stringify({ proposedStartAt }), method: 'POST' },
)

export const transitionProposal = (
  appointmentId: number,
  proposalId: number,
  action: 'accept' | 'reject' | 'cancel' | 'force',
) => {
  const path = `/v1/appointments/${appointmentId}`
    + `/proposals/${proposalId}/${action}`
  return api(path, {
  body: action === 'force' ? JSON.stringify({ confirm: true }) : undefined,
  method: 'POST',
  })
}
