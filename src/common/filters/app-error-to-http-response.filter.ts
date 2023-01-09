import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { AppError, AppErrorCode } from '~/common/errors';
import { UnreachableCaseError } from '~/common/utils';

/**
 * Catches and converts AppErrors to the appropriate HTTP response
 */
@Catch(AppError)
export class AppErrorToHttpResponseFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * @note implementation adapted from: https://docs.nestjs.com/exception-filters#catch-everything
   */
  catch({ code, message }: AppError, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const statusCode = this.appErrorCodeToHttpStatusCode(code);
    if (statusCode >= 500) {
      message = 'Internal Server Error';
    }

    const responseBody = {
      statusCode,
      message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }

  private appErrorCodeToHttpStatusCode(code: AppErrorCode): HttpStatus {
    switch (code) {
      case AppErrorCode.NotFound:
        return HttpStatus.NOT_FOUND;
      case AppErrorCode.Conflict:
        return HttpStatus.CONFLICT;
      case AppErrorCode.Config:
      case AppErrorCode.Internal:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case AppErrorCode.Validation:
        return HttpStatus.BAD_REQUEST;
      default:
        throw new UnreachableCaseError(code);
    }
  }
}
