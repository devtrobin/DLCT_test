import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { healthController } from './controllers/health.controller'
import { metricsController } from './controllers/metrics.controller'
import { AppError } from './errors/app-error'
import { compressionMiddleware } from './middleware/compression.middleware'
import { corsOrigin } from './middleware/cors-origin'
import { errorMiddleware } from './middleware/error.middleware'
import { metricsMiddleware } from './middleware/metrics.middleware'
import { apiRouter } from './routers/api.router'
import { authRouter } from './routers/auth.router'
import { publicRouter } from './routers/public.router'

const app = express()

app.use(cookieParser())
app.use(cors({ credentials: true, origin: corsOrigin }))
app.use(helmet())
app.use(compressionMiddleware)
app.use(express.json({ limit: '100kb' }))
app.use(metricsMiddleware)

app.get('/health', healthController)
app.get('/metrics', metricsController)
app.use('/auth', authRouter)
app.use('/v1', publicRouter)
app.use('/v1', apiRouter)

app.use((_request, _response, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND'))
})
app.use(errorMiddleware)

export default app
