import app from './app'
import { environment } from './config/environment'
import { prisma } from './database/prisma'
import { logger } from './services/logger'

const server = app.listen(environment.PORT, () => {
  logger.info('server_started', { port: environment.PORT })
})

async function stopServer(signal: string): Promise<void> {
  logger.info('server_stopping', { signal })

  server.close(async (error) => {
    await prisma.$disconnect()

    if (error) {
      logger.error('server_stop_failed', { reason: error.message })
      process.exit(1)
    }

    logger.info('server_stopped')
    process.exit(0)
  })
}

process.once('SIGINT', () => void stopServer('SIGINT'))
process.once('SIGTERM', () => void stopServer('SIGTERM'))
