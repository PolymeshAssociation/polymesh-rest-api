import { Inject, Injectable } from '@nestjs/common';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { ScheduleService } from '~/schedule/schedule.service';

@Injectable()
export class PolymeshService {
  private heartbeatIntervalId = 'polymeshHeartbeat';

  constructor(
    @Inject(POLYMESH_API) public readonly polymeshApi: Polymesh,
    private readonly scheduleService: ScheduleService,
    relayerAccountsService: RelayerAccountsService
  ) {
    scheduleService.addInterval(
      this.heartbeatIntervalId,
      async () => {
        await polymeshApi.network.getLatestBlock();
      },
      10000
    );

    const accounts = relayerAccountsService.findAll();

    /* istanbul ignore next: remove when this is replaced by a real service */
    accounts.forEach(({ mnemonic, did }) => {
      const { address: account } = polymeshApi.addSigner({ accountMnemonic: mnemonic });

      relayerAccountsService.setAddress(did, account);
    });
  }

  /* istanbul ignore next: not worth the trouble */
  public close(): Promise<void> {
    const { polymeshApi, scheduleService, heartbeatIntervalId } = this;
    scheduleService.deleteInterval(heartbeatIntervalId);
    return polymeshApi.disconnect();
  }
}
