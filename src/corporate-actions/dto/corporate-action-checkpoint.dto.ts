/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { CaCheckpointType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class CorporateActionCheckpointDto {
  @ApiProperty({
    description: 'Whether the Checkpoint already exists or will be created by a Schedule',
    enum: CaCheckpointType,
    example: CaCheckpointType.Existing,
  })
  @IsEnum(CaCheckpointType)
  readonly type: CaCheckpointType;

  @ApiProperty({
    description: 'ID of the Checkpoint/Schedule (depending on `type`)',
    type: 'string',
    example: '1',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly id: BigNumber;

  constructor(dto: CorporateActionCheckpointDto) {
    Object.assign(this, dto);
  }
}
