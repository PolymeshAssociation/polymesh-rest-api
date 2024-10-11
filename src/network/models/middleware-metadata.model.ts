/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class MiddlewareMetadataModel {
  @ApiProperty({
    description: 'Chain name',
    type: 'string',
    example: 'Development',
  })
  readonly chain: string;

  @ApiProperty({
    description: 'Genesis block hash',
    type: 'string',
    example: '0xabc',
  })
  readonly genesisHash: string;

  @ApiProperty({
    description: 'Indexer health status',
    type: 'boolean',
    example: true,
  })
  readonly indexerHealthy: boolean;

  @ApiProperty({
    description: 'Last processed block height',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly lastProcessedHeight: BigNumber;

  @ApiProperty({
    description: 'Last processed block timestamp',
    type: 'string',
    example: '2',
  })
  readonly lastProcessedTimestamp: Date;

  @ApiProperty({
    description: 'Network version number',
    type: 'string',
    example: '2',
  })
  readonly specName: string;

  @ApiProperty({
    description: 'Target block height',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly targetHeight: BigNumber;

  @ApiProperty({
    description: 'Subquery version',
    type: 'string',
    example: '13.0.0',
  })
  readonly sqVersion: string;

  constructor(model: MiddlewareMetadataModel) {
    Object.assign(this, model);
  }
}
