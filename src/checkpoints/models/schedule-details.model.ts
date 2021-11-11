/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class ScheduleDetailsModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly created Schedule',
    type: CheckpointScheduleModel,
  })
  @Type(() => CheckpointScheduleModel)
  readonly schedule: CheckpointScheduleModel;

  constructor(model: ScheduleDetailsModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
