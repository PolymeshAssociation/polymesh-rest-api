/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsBoolean, IsOptional } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class MortalityDto {
  @ApiProperty({
    description:
      'How many blocks the transaction will be valid for, rounded up to a power of 2. e.g. 63 becomes 64',
    type: 'string',
    example: '64',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly lifetime?: BigNumber;

  @ApiProperty({
    description: 'Makes the transaction immortal (i.e. never expires). Defaults to false',
    type: 'boolean',
    example: false,
  })
  @IsBoolean()
  readonly immortal: boolean;
}
