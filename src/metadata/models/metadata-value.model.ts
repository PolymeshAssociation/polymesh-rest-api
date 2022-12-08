/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetadataLockStatus } from '@polymeshassociation/polymesh-sdk/types';

export class MetadataValueModel {
  @ApiProperty({
    description: 'Value of the Asset Metadata',
    type: 'string',
    example: 'Some metadata',
  })
  readonly value: string;

  @ApiProperty({
    description: 'Date at which the Metadata value expires, null if it never expires',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
    nullable: true,
  })
  readonly expiry: Date | null;

  @ApiProperty({
    description: 'Lock status of Metadata value',
    enum: MetadataLockStatus,
    example: MetadataLockStatus.LockedUntil,
  })
  readonly lockStatus: MetadataLockStatus;

  @ApiPropertyOptional({
    description:
      'Date till which the Metadata value will be locked. This only applies when `status` is `LockedUntil`',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
  })
  readonly lockedUntil?: Date;

  constructor(model: MetadataValueModel) {
    Object.assign(this, model);
  }
}
