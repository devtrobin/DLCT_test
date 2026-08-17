import { describe, expect, test } from 'bun:test'
import { DateTime } from 'luxon'

import { resolveLocalStarts } from './services/local-time.service'

const day = (date: string) => DateTime.fromISO(date, {
  zone: 'Europe/Paris',
}).startOf('day')

describe('daylight-saving transitions', () => {
  test('rejects a local time skipped during the spring transition', () => {
    const starts = resolveLocalStarts({
      date: day('2026-03-29'),
      minute: 2 * 60 + 30,
      timezone: 'Europe/Paris',
    })
    expect(starts).toHaveLength(0)
  })

  test('returns both occurrences during the autumn transition', () => {
    const starts = resolveLocalStarts({
      date: day('2026-10-25'),
      minute: 2 * 60 + 30,
      timezone: 'Europe/Paris',
    })
    expect(starts).toHaveLength(2)
    expect(new Set(starts.map((start) => start.toUTC().toISO())).size).toBe(2)
  })
})
