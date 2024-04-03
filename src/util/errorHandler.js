export class AppError extends Error {
  constructor(statusCode, statusMessage) {
    super(statusMessage);

    this.statusCode = statusCode;
    this.statusMessage = `${statusCode}`.startsWith("4")
      ? `Fail: ${statusMessage}`
      : `Error: ${statusMessage}`;
    this.isOperational = true;

    // avoid constructor to get capture in error stack
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
