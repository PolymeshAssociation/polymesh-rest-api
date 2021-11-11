/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, ValidateNested } from 'class-validator';

import { CalendarPeriodDto } from '~/checkpoints/dto/calendar-period.dto';
import { SignerDto } from '~/common/dto/signer.dto';

export class CreateCheckpointScheduleDto extends SignerDto {
  @ApiProperty({
    description:
      'Date from which Schedule will start creating Checkpoints. A null value means the Checkpoint creation starts now.',
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
      'Period in which the Schedule creates a Checkpoint. A null value means this Schedule creates a single Checkpoint and then expires',
    type: CalendarPeriodDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarPeriodDto)
  readonly period: CalendarPeriodDto | null;

  @ApiProperty({
    description:
      'Number of repetitions of the Checkpoint creations. A null value means this Schedule creates a single Checkpoint and then expires',
    type: 'number',
    example: 12,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  readonly repetitions: number | null;
}
