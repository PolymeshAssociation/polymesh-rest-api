import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import {
  AppConfigError,
  AppConflictError,
  AppError,
  AppInternalError,
  AppNotFoundError,
  AppUnauthorizedError,
  AppUnprocessableError,
  AppValidationError,
} from '~/common/errors';
import { AppErrorToHttpResponseFilter } from '~/common/filters/app-error-to-http-response.filter';
import { testValues } from '~/test-utils/consts';

const { resource } = testValues;

type ExpectedReplyArgs = [{ message: string; statusCode: number }, HttpStatus];
type Case = [AppError, ExpectedReplyArgs];

describe('AppErrorToHttpResponseFilter', () => {
  const mockReplyFn = jest.fn();
  const mockHttpAdaptorHost = createMock<HttpAdapterHost>();
  mockHttpAdaptorHost.httpAdapter.reply = mockReplyFn;
  const mockHost = createMock<ArgumentsHost>();
  const errorToHttpResponseFilter = new AppErrorToHttpResponseFilter(mockHttpAdaptorHost);

  const notFoundError = new AppNotFoundError(resource.id, resource.type);
  const conflictError = new AppConflictError(resource.id, resource.type);
  const configError = new AppConfigError('TEST_CONFIG', 'is a test error');
  const unauthorizedError = new AppUnauthorizedError('test');
  const unprocessesableError = new AppUnprocessableError('test');
  const validationError = new AppValidationError('test validation');
  const internalError = new AppInternalError('internal test');

  const cases: Case[] = [
    [notFoundError, [{ message: notFoundError.message, statusCode: 404 }, HttpStatus.NOT_FOUND]],
    [conflictError, [{ message: conflictError.message, statusCode: 409 }, HttpStatus.CONFLICT]],
    [
      configError,
      [{ message: 'Internal Server Error', statusCode: 500 }, HttpStatus.INTERNAL_SERVER_ERROR],
    ],
    [
      unauthorizedError,
      [{ message: unauthorizedError.message, statusCode: 401 }, HttpStatus.UNAUTHORIZED],
    ],
    [
      unprocessesableError,
      [{ message: unprocessesableError.message, statusCode: 422 }, HttpStatus.UNPROCESSABLE_ENTITY],
    ],
    [
      validationError,
      [{ message: validationError.message, statusCode: 400 }, HttpStatus.BAD_REQUEST],
    ],
    [
      internalError,
      [{ message: 'Internal Server Error', statusCode: 500 }, HttpStatus.INTERNAL_SERVER_ERROR],
    ],
  ];

  test.each(cases)('should transform %p into %p', async (error, expected) => {
    errorToHttpResponseFilter.catch(error, mockHost);
    return expect(mockReplyFn).toHaveBeenCalledWith({}, ...expected);
  });

  it('should throw if an unknown Error is encountered', () => {
    const unknownError = new Error('unknown error') as AppError;
    return expect(() => errorToHttpResponseFilter.catch(unknownError, mockHost)).toThrow();
  });
});
