/* istanbul ignore file */

export enum AppErrorCode {
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  Config = 'Config',
  Validation = 'Validation',
  Internal = 'Internal',
}

export abstract class AppError extends Error {
  public readonly code: AppErrorCode;
}

export class AppNotFoundError extends AppError {
  public readonly code = AppErrorCode.NotFound;

  constructor(id: string, resource: string) {
    super(`${resource} not found with identifier: "${id}"`);
  }
}

export class AppConflictError extends AppError {
  public readonly code = AppErrorCode.Conflict;

  constructor(id: string, resource: string) {
    super(`${resource} already exists with unique identifier: "${id}"`);
  }
}

export class AppConfigError extends AppError {
  public readonly code = AppErrorCode.Config;

  constructor(key: string, message: string) {
    super(`Config error: ${key}: ${message}`);
  }
}
export class AppValidationError extends AppError {
  public readonly code = AppErrorCode.Validation;

  constructor(message: string) {
    super(`Validation error: ${message}`);
  }
}
export class AppInternalError extends AppError {
  public readonly code = AppErrorCode.Internal;

  constructor(message: string) {
    super(`Internal Error: ${message}`);
  }
}

export function isAppError(err: Error): err is AppError {
  return err instanceof AppError;
}
