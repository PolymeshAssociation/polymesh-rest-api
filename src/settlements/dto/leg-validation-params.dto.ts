/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsAsset, IsBigNumber, IsDid } from '~/common/decorators/validation';

export class LegValidationParamsDto {
  @ApiPropertyOptional({
    description: 'Amount of the Asset to be transferred',
    type: 'string',
    example: '1000',
  })
  @ValidateIf(({ nfts }) => !nfts)
  @IsBigNumber()
  @ToBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'The NFT IDs to be transferred for the collection',
    type: 'string',
    isArray: true,
    example: ['1'],
  })
  @ValidateIf(({ amount }) => !amount)
  @IsBigNumber()
  @ToBigNumber()
  readonly nfts?: BigNumber[];

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
    description: 'The Asset (Asset ID/Ticker) to be transferred',
    type: 'string',
    example: '0x12345678',
  })
  @IsAsset()
  readonly asset: string;
}
