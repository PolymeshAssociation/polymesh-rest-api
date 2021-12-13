/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { CaCheckpointType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';

export class CorporateActionCheckpointDto {
  @ApiProperty({
    description: 'Type of the checkpoint',
    enum: CaCheckpointType,
    example: CaCheckpointType.Existing,
  })
  @IsEnum(CaCheckpointType)
  readonly type: CaCheckpointType;

  @ApiProperty({
    description: 'Unique identifier for the checkpoint entity as specified by `type`',
    type: 'string',
    example: '1',
  })
  @ToBigNumber()
  readonly id: BigNumber;
}
