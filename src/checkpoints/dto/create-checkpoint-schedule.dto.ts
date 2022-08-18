/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateNested } from 'class-validator';

import { CalendarPeriodDto } from '~/checkpoints/dto/calendar-period.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class CreateCheckpointScheduleDto extends SignerDto {
  @ApiProperty({
    description:
      'Date from which the Schedule will start creating Checkpoints. A null value means the first Checkpoint will be created immediately',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
    nullable: true,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly start: Date | null;

  @ApiProperty({
    description:
      'Periodic interval between Checkpoints. For example, a period of 2 weeks means that a Checkpoint will be created every 2 weeks. A null value means this Schedule creates a single Checkpoint and then expires',
    type: CalendarPeriodDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarPeriodDto)
  readonly period: CalendarPeriodDto | null;

  @ApiProperty({
    description:
      'Number of Checkpoints that should be created by this Schedule. A null or 0 value means infinite Checkpoints (the Schedule never expires)',
    type: 'string',
    example: '12',
    nullable: true,
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly repetitions: BigNumber | null;
}
