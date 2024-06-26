/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { InstructionOffChainLeg } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid } from '~/common/decorators/validation';
import { LegType } from '~/common/types';
import { AssetLegDto } from '~/settlements/dto/asset-leg.dto';

export class OffChainLegDto extends AssetLegDto {
  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly from: string;

  @ApiProperty({
    description: 'DID of the receiver',
    type: 'string',
    example: '0x0111111111111111111111111111111111111111111111111111111111111111',
  })
  @IsDid()
  readonly to: string;

  @ApiPropertyOptional({
    description: 'Amount of the off chain Asset being transferred',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly offChainAmount: BigNumber;

  @ApiProperty({ enum: LegType, default: LegType.offChain })
  @IsEnum(LegType)
  readonly type = LegType.offChain;

  public toLeg(): InstructionOffChainLeg {
    const { from, to, asset, offChainAmount } = this;
    return { from, to, asset, offChainAmount };
  }
}
