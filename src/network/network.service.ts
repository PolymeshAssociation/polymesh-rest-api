import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Account } from '@polymeshassociation/polymesh-sdk/types';

import { NetworkPropertiesModel } from '~/network/models/network-properties.model';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class NetworkService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async getNetworkProperties(): Promise<NetworkPropertiesModel> {
    return this.polymeshService.polymeshApi.network.getNetworkProperties();
  }

  public async getLatestBlock(): Promise<BigNumber> {
    return this.polymeshService.polymeshApi.network.getLatestBlock();
  }

  public getTreasuryAccount(): Account {
    return this.polymeshService.polymeshApi.network.getTreasuryAccount();
  }
}
