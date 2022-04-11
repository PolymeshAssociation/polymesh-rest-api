import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MiddlewareInterceptor implements NestInterceptor {
  /**
   * Intercept method, checks if API is initialized with Polymesh GraphQL Middleware Service or not
   * @param _context details about the current request
   * @param next implements the handle method that returns an Observable
   */
  public intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { POLYMESH_MIDDLEWARE_URL, POLYMESH_MIDDLEWARE_API_KEY } = process.env;

    if (!POLYMESH_MIDDLEWARE_URL || !POLYMESH_MIDDLEWARE_API_KEY) {
      throw new ForbiddenException(
        'Cannot make the request without an enabled middleware connection. Please provide `POLYMESH_MIDDLEWARE_URL` and `POLYMESH_MIDDLEWARE_API_KEY` in your environment'
      );
    }
    return next.handle();
  }
}
