import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class WebhookResponseCodeInterceptor implements NestInterceptor {
  /**
   * Intercept method, checks the response, and overrides the response code from 201 (Created) to 202 (Accepted) if the response is for a webhook
   * @param context details about the current request
   * @param next implements the handle method that returns an Observable
   */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();
    const res: Response = httpCtx.getResponse();

    if (res.statusCode === 201 && req.body.webhookUrl) {
      res.statusCode = 202;
    }

    return next.handle();
  }
}
