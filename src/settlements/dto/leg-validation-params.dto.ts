/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid, IsTicker } from '~/common/decorators/validation';

export class LegValidationParamsDto {
  @ApiProperty({
    description: 'Amount of the Asset to be transferred',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly fromDid: string;

  @ApiProperty({
    description:
      'Portfolio ID of the sender from which Asset is to be transferred. Use 0 for the Default Portfolio',
    type: 'string',
    example: '1',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly fromPortfolio: BigNumber;

  @ApiProperty({
    description: 'DID of the receiver',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly toDid: string;

  @ApiProperty({
    description:
      'Portfolio ID of the receiver to which Asset is to be transferred. Use 0 for Default Portfolio',
    type: 'string',
    example: '2',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly toPortfolio: BigNumber;

  @ApiProperty({
    description: 'Ticker of the Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @IsTicker()
  readonly asset: string;
}
