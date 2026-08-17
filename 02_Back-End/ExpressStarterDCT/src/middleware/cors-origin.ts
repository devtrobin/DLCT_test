import type { CorsOptions } from 'cors'

import { corsOrigins } from '../config/environment'
import { AppError } from '../errors/app-error'

export const corsOrigin: CorsOptions['origin'] = (origin, callback) => {
  if (!origin || corsOrigins.includes(origin)) {
    callback(null, true)
    return
  }

  callback(new AppError(403, 'ORIGIN_FORBIDDEN'))
}
