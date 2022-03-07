import { Injectable } from '@nestjs/common';
import { AccountBalance } from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class AccountsService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;

    return polymeshApi.accountManagement.getAccountBalance({ account });
  }
}
