import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { AppConflictError, AppError, AppNotFoundError } from '~/common/errors';
import { AppErrorToHttpResponseFilter } from '~/common/filters/app-error-to-http-response.filter';
import { testResource } from '~/test-utils/consts';

type ExpectedReplyArgs = [{ message: string; statusCode: number }, HttpStatus];
type Case = [AppError, ExpectedReplyArgs];

describe('AppErrorToHttpResponseFilter', () => {
  const mockReplyFn = jest.fn();
  const mockHttpAdaptorHost = createMock<HttpAdapterHost>();
  mockHttpAdaptorHost.httpAdapter.reply = mockReplyFn;
  const mockHost = createMock<ArgumentsHost>();
  const errorToHttpResponseFilter = new AppErrorToHttpResponseFilter(mockHttpAdaptorHost);

  const notFoundError = new AppNotFoundError(testResource.id, testResource.type);
  const conflictError = new AppConflictError(testResource.id, testResource.type);

  const cases: Case[] = [
    [notFoundError, [{ message: notFoundError.message, statusCode: 404 }, HttpStatus.NOT_FOUND]],
    [conflictError, [{ message: conflictError.message, statusCode: 409 }, HttpStatus.CONFLICT]],
  ];

  test.each(cases)('should transform %p into %p', async (error, expected) => {
    errorToHttpResponseFilter.catch(error, mockHost);
    expect(mockReplyFn).toHaveBeenCalledWith({}, ...expected);
  });

  it('should throw if an unknown Error is encountered', () => {
    const unknownError = new Error('unknown error') as AppError;
    return expect(() => errorToHttpResponseFilter.catch(unknownError, mockHost)).toThrow();
  });
});
