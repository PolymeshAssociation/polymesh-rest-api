import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NetworkBlockModel } from '~/network/models/network-block.model';
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

  @ApiOperation({
    summary: 'Get the latest block number',
    description: 'This endpoint will provide the latest block ID',
  })
  @ApiOkResponse({
    description: 'Latest block ID that has been added to the blockchain',
    type: NetworkBlockModel,
  })
  @Get('latest-block')
  public async getLatestBlock(): Promise<NetworkBlockModel> {
    const latestBlock = await this.networkService.getLatestBlock();

    return new NetworkBlockModel({ id: latestBlock });
  }
}
