const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code)
  }
}

export const api = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const body = await response.json() as T & {
    error?: string
    details?: Record<string, unknown>
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error ?? 'INTERNAL_ERROR',
      body.details,
    )
  }
  return body
}
