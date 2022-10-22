import { Injectable } from '@nestjs/common';

import { NetworkPropertiesModel } from '~/network/models/network-properties.model';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class NetworkService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async getNetworkProperties(): Promise<NetworkPropertiesModel> {
    return this.polymeshService.polymeshApi.network.getNetworkProperties();
  }
}
