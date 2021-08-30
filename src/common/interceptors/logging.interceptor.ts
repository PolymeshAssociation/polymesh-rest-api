import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly ctxPrefix = LoggingInterceptor.name;

  constructor(private readonly logger: PolymeshLogger) {}

  /**
   * Intercept method, logs before and after the request being processed
   * @param context details about the current request
   * @param next implements the handle method that returns an Observable
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req: Request = context.switchToHttp().getRequest();
    const { method, url, body } = req;

    const message = `Request: ${method} ${url}`;

    // TODO @prashantasdeveloper Log header values once API authentication is in place
    this.logger.log(
      {
        message,
        method,
        url,
        body,
      },
      this.getLogContext(method, url)
    );

    return next.handle().pipe(
      tap({
        next: (): void => {
          this.logNext(context);
        },
        error: (err: Error): void => {
          this.logError(err, context);
        },
      })
    );
  }

  /**
   * Logs the request response in success cases
   *
   * @param context details about the current request
   */
  private logNext(context: ExecutionContext): void {
    const { method, url } = context.switchToHttp().getRequest();
    const { statusCode } = context.switchToHttp().getResponse();

    const ctx = this.getLogContext(method, url);
    const message = `Response: ${statusCode}`;

    this.logger.log({ message, method, url }, ctx);
  }

  /**
   * Logs the request response in success cases
   *
   * @param error Error object
   * @param context details about the current request
   */
  private logError(error: Error, context: ExecutionContext): void {
    const { method, url, body } = context.switchToHttp().getRequest();
    const ctx = this.getLogContext(method, url);

    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const message = `Response: ${statusCode}`;

      if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          {
            message,
            method,
            url,
            body,
            statusCode,
            error,
          },
          error.stack,
          ctx
        );
      } else {
        this.logger.warn(
          {
            message,
            method,
            url,
            body,
            statusCode,
            error,
          },
          ctx
        );
      }
    } else {
      this.logger.error(
        {
          message: 'Error occurred',
        },
        error.stack,
        ctx
      );
    }
  }

  /**
   * Get log context to be appended in logs
   *
   * @param method Method of the request
   * @param url Request url
   * @returns Formatted context template
   */
  getLogContext(method: string, url: string): string {
    return `${this.ctxPrefix} ${method} ${url}`;
  }
}
