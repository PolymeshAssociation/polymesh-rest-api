/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString, ValidateIf } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'DID of the sender portfolio owner (use with fromPortfolio)',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ValidateIf(({ fromAccount }) => !fromAccount)
  @IsDid()
  readonly fromDid?: string;

  @ApiPropertyOptional({
    description:
      'Portfolio ID of the sender from which Asset is to be transferred. Use 0 for the Default Portfolio',
    type: 'string',
    example: '1',
  })
  @ValidateIf(({ fromAccount }) => !fromAccount)
  @IsBigNumber()
  @ToBigNumber()
  readonly fromPortfolio?: BigNumber;

  @ApiPropertyOptional({
    description: 'Account address of the sender (alternative to fromDid/fromPortfolio)',
    type: 'string',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @ValidateIf(({ fromDid, fromPortfolio }) => !fromDid && fromPortfolio === undefined)
  @IsString()
  readonly fromAccount?: string;

  @ApiPropertyOptional({
    description: 'DID of the receiver portfolio owner (use with toPortfolio)',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ValidateIf(({ toAccount }) => !toAccount)
  @IsDid()
  readonly toDid?: string;

  @ApiPropertyOptional({
    description:
      'Portfolio ID of the receiver to which Asset is to be transferred. Use 0 for Default Portfolio',
    type: 'string',
    example: '2',
  })
  @ValidateIf(({ toAccount }) => !toAccount)
  @IsBigNumber()
  @ToBigNumber()
  readonly toPortfolio?: BigNumber;

  @ApiPropertyOptional({
    description: 'Account address of the receiver (alternative to toDid/toPortfolio)',
    type: 'string',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @ValidateIf(({ toDid, toPortfolio }) => !toDid && toPortfolio === undefined)
  @IsString()
  readonly toAccount?: string;

  @ApiProperty({
    description: 'The Asset (Asset ID/Ticker) to be transferred',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @IsAsset()
  readonly asset: string;
}
