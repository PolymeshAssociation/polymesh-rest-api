import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { ScheduledTaskType } from '~/schedule/types';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(ScheduleService.name);
  }

  public addInterval(id: string, cb: () => void | Promise<void>, ms: number): void {
    const { schedulerRegistry } = this;

    const interval = setInterval(this.wrapCallback(id, ScheduledTaskType.Interval, cb), ms);

    schedulerRegistry.addInterval(id, interval);
  }

  public deleteInterval(id: string): void {
    this.schedulerRegistry.deleteInterval(id);
  }

  public addTimeout(id: string, cb: () => void | Promise<void>, ms: number): void {
    const { schedulerRegistry } = this;

    const timeout = setTimeout(this.wrapCallback(id, ScheduledTaskType.Timeout, cb), ms);

    schedulerRegistry.addTimeout(id, timeout);
  }

  public deleteTimeout(id: string): void {
    this.schedulerRegistry.deleteTimeout(id);
  }

  /**
   * Wrap a task callback in a function that handles any errors
   *
   * @param id - task identifier (i.e. "sendNotification_1")
   * @param cb - task callback to be wrapped
   *
   * @returns a wrapped version of the callback that gracefully handles errors
   */
  private wrapCallback(
    id: string,
    type: ScheduledTaskType,
    cb: () => void | Promise<void>
  ): () => Promise<void> {
    const { logger } = this;

    return async (): Promise<void> => {
      // the scheduler registry keeps timeout ids forever. This allows us to reuse them
      if (type === ScheduledTaskType.Timeout) {
        this.deleteTimeout(id);
      }

      try {
        await cb();
      } catch (err) {
        logger.error(
          `Error on scheduled task "${id}": ${(err as Error).message || JSON.stringify(err)}`
        );
      }
    };
  }
}
