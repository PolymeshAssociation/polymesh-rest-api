/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateCheckpointScheduleDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Periodic interval between Checkpoints. For example, a period of 2 weeks means that a Checkpoint will be created every 2 weeks. A null value means this Schedule creates a single Checkpoint and then expires',
    type: Date,
    nullable: true,
    isArray: true,
  })
  @IsDate()
  @ValidateNested()
  readonly points: Date[];
}
