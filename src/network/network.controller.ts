import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MiddlewareMetadataModel } from '~/network/models/middleware-metadata.model';
import { NetworkBlockModel } from '~/network/models/network-block.model';
import { NetworkPropertiesModel } from '~/network/models/network-properties.model';
import { NetworkVersionModel } from '~/network/models/network-version.model';
import { NetworkService } from '~/network/network.service';

@ApiTags('network')
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @ApiOperation({
    summary: 'Fetch network properties',
    description: 'This endpoint will provide the network name and version',
  })
  @ApiOkResponse({
    description: 'Network properties response',
    type: NetworkPropertiesModel,
  })
  @Get()
  public async getNetworkProperties(): Promise<NetworkPropertiesModel> {
    const networkProperties = await this.networkService.getNetworkProperties();

    return new NetworkPropertiesModel(networkProperties);
  }

  @ApiOperation({
    summary: 'Get the chain version',
    description: 'This endpoint will provide the current chain version',
  })
  @ApiOkResponse({
    description: 'Chain version response',
    type: NetworkVersionModel,
  })
  @Get('version')
  public async getVersion(): Promise<NetworkVersionModel> {
    const version = await this.networkService.getVersion();

    return new NetworkVersionModel({ version });
  }

  @ApiOperation({
    summary: 'Get the latest block',
    description: 'This endpoint will provide the latest block number',
  })
  @ApiOkResponse({
    description: 'Latest block number that has been added to the chain',
    type: NetworkBlockModel,
  })
  @Get('latest-block')
  public async getLatestBlock(): Promise<NetworkBlockModel> {
    const latestBlock = await this.networkService.getLatestBlock();

    return new NetworkBlockModel({ id: latestBlock });
  }

  @ApiOperation({
    summary: 'Get the middleware metadata',
    description:
      'This endpoint will provide the information regarding middleware that the API is connected to',
  })
  @ApiOkResponse({
    description: 'Middleware metadata',
    type: MiddlewareMetadataModel,
  })
  @ApiNotFoundResponse({
    description: 'Middleware metadata not found',
  })
  @Get('middleware-metadata')
  public async getMiddleWareMetaData(): Promise<MiddlewareMetadataModel> {
    const metadata = await this.networkService.getMiddlewareMetadata();

    if (!metadata) {
      throw new NotFoundException('Middleware metadata not found');
    }

    return new MiddlewareMetadataModel(metadata);
  }
}
