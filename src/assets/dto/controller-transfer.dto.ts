/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { AssetHolderDto } from '~/common/dto/asset-holder.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class ControllerTransferDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Portfolio from which Asset tokens will be transferred',
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  origin: PortfolioDto;

  @ApiProperty({
    description: 'The amount of the Asset tokens to be transferred',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;

  @ApiPropertyOptional({
    description:
      'Destination asset holder (account or portfolio) to receive the tokens. Defaults to the signer default portfolio',
    type: () => AssetHolderDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssetHolderDto)
  readonly destination?: AssetHolderDto;
}
