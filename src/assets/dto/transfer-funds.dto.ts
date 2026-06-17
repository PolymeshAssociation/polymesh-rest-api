/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsAsset, IsBigNumber } from '~/common/decorators/validation';
import { AssetHolderDto } from '~/common/dto/asset-holder.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class TransferFundsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Asset holder from which funds will be transferred',
    type: () => AssetHolderDto,
  })
  @ValidateNested()
  @Type(() => AssetHolderDto)
  readonly from: AssetHolderDto;

  @ApiProperty({
    description: 'Asset holder to which funds will be transferred',
    type: () => AssetHolderDto,
  })
  @ValidateNested()
  @Type(() => AssetHolderDto)
  readonly to: AssetHolderDto;

  @ApiProperty({
    description: 'The Asset (Asset ID/Ticker) to be transferred',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @IsAsset()
  readonly asset: string;

  @ApiPropertyOptional({
    description: 'NFT IDs to transfer from the collection',
    type: 'string',
    isArray: true,
    example: ['1'],
  })
  @ValidateIf(({ amount }) => !amount)
  @IsBigNumber()
  @ToBigNumber()
  readonly nfts?: BigNumber[];

  @ApiPropertyOptional({
    description: 'Amount of fungible Asset tokens to transfer',
    type: 'string',
    example: '1000',
  })
  @ValidateIf(({ nfts }) => !nfts)
  @IsBigNumber()
  @ToBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'Optional memo for the transfer',
    type: 'string',
    example: 'Internal transfer',
  })
  @IsOptional()
  @IsString()
  readonly memo?: string;
}
