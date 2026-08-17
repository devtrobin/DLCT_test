export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(errorCode)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}
