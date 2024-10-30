/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { InstructionFungibleLeg, InstructionNftLeg } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, ValidateIf, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsAsset, IsBigNumber } from '~/common/decorators/validation';
import { AppValidationError } from '~/common/errors';
import { LegType } from '~/common/types';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { AssetLegTypeDto } from '~/settlements/dto/asset-leg.dto';

export class LegDto extends AssetLegTypeDto {
  @ApiPropertyOptional({
    description: 'Amount of the fungible Asset to be transferred',
    type: 'string',
    example: '1000',
  })
  @ValidateIf(({ nfts }) => !nfts)
  @IsBigNumber()
  @ToBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'The NFT IDs of a collection to be transferred',
    type: 'string',
    example: ['1'],
  })
  @ValidateIf(({ amount }) => !amount)
  @IsBigNumber()
  @ToBigNumber()
  readonly nfts?: BigNumber[];

  @ApiProperty({
    description: 'Portfolio of the sender',
    type: () => PortfolioDto,
    example: {
      did: '0x0600000000000000000000000000000000000000000000000000000000000000',
      id: 1,
    },
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly from: PortfolioDto;

  @ApiProperty({
    description: 'Portfolio of the receiver',
    type: () => PortfolioDto,
    example: {
      did: '0x0111111111111111111111111111111111111111111111111111111111111111',
      id: 0,
    },
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly to: PortfolioDto;

  @ApiProperty({
    description: 'Asset associated with the leg',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @IsAsset()
  readonly asset: string;

  @ApiProperty({ enum: LegType, default: LegType.onChain })
  @IsEnum(LegType)
  readonly type = LegType.onChain;

  public toLeg(): InstructionFungibleLeg | InstructionNftLeg {
    const { amount, nfts, asset, from, to } = this;
    if (amount) {
      return {
        from: from.toPortfolioLike(),
        to: to.toPortfolioLike(),
        asset,
        amount,
      };
    }

    if (nfts) {
      return {
        nfts,
        asset,
        from: from.toPortfolioLike(),
        to: to.toPortfolioLike(),
      };
    }
    throw new AppValidationError('Either nfts/amount should be specific for a on-chain leg');
  }
}
