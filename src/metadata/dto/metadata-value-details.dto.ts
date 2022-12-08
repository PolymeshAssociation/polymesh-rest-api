/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetadataLockStatus } from '@polymeshassociation/polymesh-sdk/types';
import { IsDate, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export class MetadataValueDetailsDto {
  @ApiProperty({
    description: 'Date at which the Metadata value expires, null if it never expires',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
    nullable: true,
    default: null,
  })
  @IsOptional()
  @IsDate()
  readonly expiry: Date | null;

  @ApiProperty({
    description: 'Lock status of Metadata value',
    enum: MetadataLockStatus,
    example: MetadataLockStatus.LockedUntil,
  })
  @IsEnum(MetadataLockStatus)
  readonly lockStatus: MetadataLockStatus;

  @ApiPropertyOptional({
    description:
      'Date till which the Metadata value will be locked. This is required when `status` is `LockedUntil`',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
  })
  @ValidateIf(
    ({ lockStatus }: MetadataValueDetailsDto) => lockStatus === MetadataLockStatus.LockedUntil
  )
  @IsDate()
  readonly lockedUntil?: Date;
}
