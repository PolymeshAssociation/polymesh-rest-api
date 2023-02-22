/* istanbul ignore file */

export enum AppErrorCode {
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  Config = 'Config',
  Validation = 'Validation',
  Unauthorized = 'Unauthorized',
  Unprocessable = 'Unprocessable',
  Internal = 'Internal',
}

export abstract class AppError extends Error {
  public readonly code: AppErrorCode;
}

export class AppNotFoundError extends AppError {
  public readonly code = AppErrorCode.NotFound;

  constructor(id: string, resource: string) {
    const identifierMessage = id !== '' ? `: with identifier: "${id}"` : '';

    super(`Not Found: ${resource} was not found${identifierMessage}`);
  }
}

export class AppConflictError extends AppError {
  public readonly code = AppErrorCode.Conflict;

  constructor(id: string, resource: string) {
    super(`Conflict: ${resource} already exists with unique identifier: "${id}"`);
  }
}

export class AppConfigError extends AppError {
  public readonly code = AppErrorCode.Config;

  constructor(key: string, message: string) {
    super(`Config: ${key}: ${message}`);
  }
}
export class AppValidationError extends AppError {
  public readonly code = AppErrorCode.Validation;

  constructor(message: string) {
    super(`Validation: ${message}`);
  }
}

export class AppUnauthorizedError extends AppError {
  public readonly code = AppErrorCode.Unauthorized;

  constructor(message: string) {
    super(`Unauthorized: ${message}`);
  }
}

export class AppUnprocessableError extends AppError {
  public readonly code = AppErrorCode.Unprocessable;

  constructor(message: string) {
    super(`Unprocessable: ${message}`);
  }
}

export class AppInternalError extends AppError {
  public readonly code = AppErrorCode.Internal;

  constructor(message: string) {
    super(`Internal: ${message}`);
  }
}

export function isAppError(err: Error): err is AppError {
  return err instanceof AppError;
}
