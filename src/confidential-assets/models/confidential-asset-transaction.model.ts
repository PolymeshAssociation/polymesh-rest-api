/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class ConfidentialAssetTransactionModel {
  @ApiProperty({
    description: 'The confidential asset ID',
    type: 'string',
    example: '0x0a732f0ea43bb082ff1cff9a9ff59291',
  })
  readonly assetId: string;

  @ApiPropertyOptional({
    description: 'The DID from which the transaction originated',
    type: 'string',
  })
  readonly fromId?: string;

  @ApiPropertyOptional({
    description: 'The DID for which the asset was sent to',
    type: 'string',
    example: '0x786a5b0ffef119dd43565768a3557e7880be8958c7eda070e4162b27f308b23e',
    nullable: true,
  })
  readonly toId?: string;

  @ApiProperty({
    description: 'The encrypted amount of the transaction',
    type: 'string',
    example:
      '0x000000000000000000000000000000000000000000000000000000000000000064aff78e09b0fa5dccd82b594cd49d431d0fbf8ddd6830e65a0cdcd428d67428',
  })
  readonly amount: string;

  @ApiProperty({
    description: 'The time the transaction took place',
    type: 'string',
    example: '2024-02-20T13:15:54',
  })
  readonly datetime: Date;

  @ApiProperty({
    description: 'The created block id',
    type: 'string',
    example: '277',
  })
  @FromBigNumber()
  readonly createdBlockId: BigNumber;

  @ApiProperty({
    description: 'The event id associated with the transaction record',
    type: 'string',
    example: 'AccountDeposit',
  })
  readonly eventId: string;

  @ApiPropertyOptional({
    description: 'The memo',
    type: 'string',
  })
  readonly memo?: string;

  constructor(model: ConfidentialAssetTransactionModel) {
    Object.assign(this, model);
  }
}
