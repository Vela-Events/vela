export class VelaError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error: string,
    public readonly path: string,
    public readonly timestamp: string,
  ) {
    super(message);
    this.name = 'VelaError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class VelaValidationError extends VelaError {
  constructor(
    message: string,
    statusCode: number,
    error: string,
    path: string,
    timestamp: string,
  ) {
    super(message, statusCode, error, path, timestamp);
    this.name = 'VelaValidationError';
  }
}

export class VelaAuthError extends VelaError {
  constructor(
    message: string,
    statusCode: number,
    error: string,
    path: string,
    timestamp: string,
  ) {
    super(message, statusCode, error, path, timestamp);
    this.name = 'VelaAuthError';
  }
}

export class VelaForbiddenError extends VelaError {
  constructor(
    message: string,
    statusCode: number,
    error: string,
    path: string,
    timestamp: string,
  ) {
    super(message, statusCode, error, path, timestamp);
    this.name = 'VelaForbiddenError';
  }
}

export class VelaNotFoundError extends VelaError {
  constructor(
    message: string,
    statusCode: number,
    error: string,
    path: string,
    timestamp: string,
  ) {
    super(message, statusCode, error, path, timestamp);
    this.name = 'VelaNotFoundError';
  }
}

export class VelaRateLimitError extends VelaError {
  constructor(
    message: string,
    statusCode: number,
    error: string,
    path: string,
    timestamp: string,
  ) {
    super(message, statusCode, error, path, timestamp);
    this.name = 'VelaRateLimitError';
  }
}

export function buildVelaError(
  statusCode: number,
  body: Record<string, unknown>,
): VelaError {
  const message =
    typeof body.message === 'string' ? body.message : 'Unknown error';
  const error = typeof body.error === 'string' ? body.error : '';
  const path = typeof body.path === 'string' ? body.path : '';
  const timestamp = typeof body.timestamp === 'string' ? body.timestamp : '';

  switch (statusCode) {
    case 400:
      return new VelaValidationError(
        message,
        statusCode,
        error,
        path,
        timestamp,
      );
    case 401:
      return new VelaAuthError(message, statusCode, error, path, timestamp);
    case 403:
      return new VelaForbiddenError(
        message,
        statusCode,
        error,
        path,
        timestamp,
      );
    case 404:
      return new VelaNotFoundError(message, statusCode, error, path, timestamp);
    case 429:
      return new VelaRateLimitError(
        message,
        statusCode,
        error,
        path,
        timestamp,
      );
    default:
      return new VelaError(message, statusCode, error, path, timestamp);
  }
}
