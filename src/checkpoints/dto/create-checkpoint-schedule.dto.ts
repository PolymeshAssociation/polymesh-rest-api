/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateCheckpointScheduleDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'An array of dates for when to make Checkpoints',
    type: 'string',
    isArray: true,
    example: [new Date('03/23/2030').toISOString(), new Date('03/23/2031').toISOString()],
  })
  @IsArray()
  @Type(() => Date)
  readonly points: Date[];
}
