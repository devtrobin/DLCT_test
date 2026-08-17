type LogLevel = 'error' | 'info'

function writeLog(
  level: LogLevel,
  event: string,
  details: Record<string, unknown> = {},
): void {
  const entry = JSON.stringify({
    details,
    event,
    level,
    timestamp: new Date().toISOString(),
  })

  if (level === 'error') {
    console.error(entry)
    return
  }

  console.info(entry)
}

export const logger = {
  error: (event: string, details?: Record<string, unknown>) => {
    writeLog('error', event, details)
  },
  info: (event: string, details?: Record<string, unknown>) => {
    writeLog('info', event, details)
  },
}
