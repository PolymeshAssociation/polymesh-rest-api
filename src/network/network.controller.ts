import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NetworkPropertiesModel } from '~/network/models/network-properties.model';
import { NetworkService } from '~/network/network.service';
@ApiTags('network')
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @ApiOperation({
    summary: 'Fetch network properties',
    description: 'This endpoint will provide network name and version',
  })
  @ApiOkResponse({
    description: 'Network properties response',
    type: NetworkPropertiesModel,
  })
  @Get()
  public async getNetworkProperties(): Promise<NetworkPropertiesModel> {
    return new NetworkPropertiesModel(await this.networkService.getNetworkProperties());
  }
}
