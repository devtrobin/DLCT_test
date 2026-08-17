import { DateTime } from 'luxon'

type LocalStart = {
  date: DateTime
  minute: number
  timezone: string
}

export const resolveLocalStarts = (input: LocalStart): DateTime[] => {
  const hour = Math.floor(input.minute / 60)
  const minute = input.minute % 60
  const local = DateTime.fromObject({
    day: input.date.day,
    hour,
    minute,
    month: input.date.month,
    year: input.date.year,
  }, { zone: input.timezone })
  if (!local.isValid) return []
  return local.getPossibleOffsets().filter((candidate) =>
    candidate.year === input.date.year
    && candidate.month === input.date.month
    && candidate.day === input.date.day
    && candidate.hour === hour
    && candidate.minute === minute,
  )
}
