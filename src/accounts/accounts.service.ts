import { Injectable } from '@nestjs/common';
import { AccountBalance } from '@polymathnetwork/polymesh-sdk/types';

import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { processQueue, QueueResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): Promise<QueueResult<void>> {
    const { signer, ...rest } = params;
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const transferPolyx = this.polymeshService.polymeshApi.network.transferPolyx;
    return processQueue(transferPolyx, rest, { signer: address });
  }
}
