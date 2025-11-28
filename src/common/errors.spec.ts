import {
  AppConfigError,
  AppConflictError,
  AppErrorCode,
  AppInternalError,
  AppNotFoundError,
  AppUnauthorizedError,
  AppUnprocessableError,
  AppValidationError,
  isAppError,
} from '~/common/errors';

describe('errors', () => {
  it('should expose specific error codes and messages', () => {
    expect(new AppNotFoundError('1', 'Resource').code).toBe(AppErrorCode.NotFound);
    expect(new AppConflictError('id', 'Resource').message).toMatch(/already exists/);
    expect(new AppConfigError('KEY', 'bad').code).toBe(AppErrorCode.Config);
    expect(new AppValidationError('oops').message).toContain('Validation');
    expect(new AppUnauthorizedError('nope').code).toBe(AppErrorCode.Unauthorized);
    expect(new AppUnprocessableError('cannot').code).toBe(AppErrorCode.Unprocessable);
    expect(new AppInternalError('broken').message).toContain('Internal');
  });

  it('omits identifier when AppNotFoundError id is empty', () => {
    const err = new AppNotFoundError('', 'Resource');
    expect(err.message).toBe('Not Found: Resource was not found');
  });

  it('should detect AppError instances', () => {
    const error = new AppValidationError('fail');
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('generic'))).toBe(false);
  });
});
