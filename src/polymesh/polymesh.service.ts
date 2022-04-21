import { Inject, Injectable } from '@nestjs/common';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { ScheduleService } from '~/schedule/schedule.service';

@Injectable()
export class PolymeshService {
  private heartbeatIntervalId = 'polymeshHeartbeat';

  constructor(
    @Inject(POLYMESH_API) public readonly polymeshApi: Polymesh,
    private readonly scheduleService: ScheduleService
  ) {
    scheduleService.addInterval(
      this.heartbeatIntervalId,
      () => {
        polymeshApi.network.getLatestBlock();
      },
      10000
    );

    /* istanbul ignore next: remove when this is replaced by a real service */
  }

  /* istanbul ignore next: not worth the trouble */
  public close(): Promise<void> {
    const { polymeshApi, scheduleService, heartbeatIntervalId } = this;
    scheduleService.deleteInterval(heartbeatIntervalId);
    return polymeshApi.disconnect();
  }
}
