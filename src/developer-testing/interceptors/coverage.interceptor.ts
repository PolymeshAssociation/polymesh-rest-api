import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { PathCoverageRecord } from '~/developer-testing/types';

@Injectable()
export class CoverageInterceptor implements NestInterceptor {
  paths: PathCoverageRecord[] = [];

  constructor(private readonly coverageService: DeveloperTestingService) {}

  public setPaths(paths: PathCoverageRecord[]): void {
    this.paths = paths;
  }

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();

    this.coverageService.recordRoute(req);

    return next.handle();
  }
}
