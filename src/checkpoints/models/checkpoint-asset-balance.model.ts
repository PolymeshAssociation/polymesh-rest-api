/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class CheckpointAssetBalanceModel {
  @ApiProperty({
    description: 'Ticker of the Asset',
    type: 'string',
    example: 'TICKER',
  })
  readonly ticker: string;

  @ApiProperty({
    description: 'Balance of the asset held at the checkpoint',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly balance: BigNumber;

  @ApiProperty({
    description: 'The DID of the Identity whose balance this is',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiProperty({
    description: 'The Checkpoint ID this balance amount is for',
    example: '1000',
  })
  @FromBigNumber()
  readonly checkpointId: BigNumber;

  constructor(model: CheckpointAssetBalanceModel) {
    Object.assign(this, model);
  }
}
