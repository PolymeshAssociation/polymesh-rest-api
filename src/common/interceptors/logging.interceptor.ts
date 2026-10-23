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

export const REDACTED_VALUE = '*REDACTED*';

/**
 * Body fields whose values must never be written to the logs. A field is redacted when its name, lowercased and
 * stripped of non alphanumeric characters, contains any of these (e.g. `apiKey`, `api_key`, `legitimacySecret`)
 */
const sensitiveFieldFragments = [
  'mnemonic',
  'apikey',
  'secret',
  'privatekey',
  'password',
  'passphrase',
  'seed',
];

const isSensitiveField = (field: string): boolean => {
  const normalized = field.toLowerCase().replace(/[^a-z0-9]/g, '');

  return sensitiveFieldFragments.some(fragment => normalized.includes(fragment));
};

/**
 * Returns a copy of a request body with the values of sensitive fields replaced, at any depth
 */
export const redactBody = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactBody);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([field, fieldValue]) => [
        field,
        isSensitiveField(field) ? REDACTED_VALUE : redactBody(fieldValue),
      ])
    );
  }

  return value;
};

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
    const { method, url } = req;
    const body = redactBody(req.body);

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
    const { method, url, body: rawBody } = context.switchToHttp().getRequest();
    const body = redactBody(rawBody);
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
