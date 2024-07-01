/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class OffChainLegModel {
  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly from: Identity;

  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0111111111111111111111111111111111111111111111111111111111111111',
  })
  @FromEntity()
  readonly to: Identity;

  @ApiPropertyOptional({
    description: 'Amount of off chain tokens being transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly offChainAmount: BigNumber;

  @ApiProperty({
    description: 'Off chain Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  readonly asset: string;

  constructor(model: OffChainLegModel) {
    Object.assign(this, model);
  }
}
