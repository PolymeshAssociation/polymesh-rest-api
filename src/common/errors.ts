/* istanbul ignore file */

export enum AppErrorCode {
  NotFound = 'NotFound',
  Conflict = 'Conflict',
}

export abstract class AppError extends Error {
  public code: AppErrorCode;
}

export class AppNotFoundError extends AppError {
  public code = AppErrorCode.NotFound;

  constructor(id: string, resource: string) {
    super(`${resource} not found with identifier: "${id}"`);
  }
}

export class AppConflictError extends AppError {
  public code = AppErrorCode.Conflict;

  constructor(id: string, resource: string) {
    super(`${resource} already exists with unique identifier: "${id}"`);
  }
}

export function isAppError(err: Error): err is AppError {
  return err instanceof AppError;
}
