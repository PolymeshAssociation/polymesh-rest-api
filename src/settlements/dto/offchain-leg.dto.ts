/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { InstructionOffChainLeg } from '@polymeshassociation/polymesh-sdk/types';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { AssetLegDto } from '~/settlements/dto/asset-leg.dto';

export class OffChainLegDto extends AssetLegDto {
  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly from: string;

  @ApiProperty({
    description: 'DID of the receiver',
    type: 'string',
    example: '0x0111111111111111111111111111111111111111111111111111111111111111',
  })
  readonly to: string;

  @ApiPropertyOptional({
    description: 'Amount of the off chain Asset being transferred',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly offChainAmount: BigNumber;

  public toLeg(): InstructionOffChainLeg {
    const { from, to, asset, offChainAmount } = this;
    return { from, to, asset, offChainAmount };
  }

  constructor(dto: Omit<OffChainLegDto, 'toLeg'>) {
    const { type, asset, ...rest } = dto;
    super({ type, asset });
    Object.assign(this, rest);
  }
}
