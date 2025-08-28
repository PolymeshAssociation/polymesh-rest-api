/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

export class TransferRestrictionBaseDto {
  @ApiProperty({
    description: 'Type of transfer restriction',
    enum: TransferRestrictionType,
    example: TransferRestrictionType.Count,
  })
  @IsEnum(TransferRestrictionType)
  readonly type: TransferRestrictionType;
}
