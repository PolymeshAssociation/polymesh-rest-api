import { Injectable } from '@nestjs/common';
import { AccountBalance } from '@polymathnetwork/polymesh-sdk/types';

import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { processQueue, QueueResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SignerService } from '~/signer/signer.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly signingService: SignerService
  ) {}

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): Promise<QueueResult<void>> {
    const { signer, ...rest } = params;
    const { signingService, polymeshService } = this;

    const address = await signingService.getAddressByHandle(signer);

    const { transferPolyx } = polymeshService.polymeshApi.network;

    return processQueue(transferPolyx, rest, { signingAccount: address });
  }
}
