/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Venue } from '@polymathnetwork/polymesh-sdk/internal';
import {
  EventIdentifier,
  InstructionStatus,
  InstructionType,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { LegModel } from '~/settlements/model/leg.model';

export class InstructionModel {
  @ApiProperty({
    description: 'ID of the venue through which the settlement is handled',
    type: 'string',
    example: '123',
  })
  @FromEntity()
  readonly venue: Venue;

  @ApiProperty({
    description: 'Date when the Instruction was created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'The current status of the Instruction',
    type: 'string',
    enum: InstructionStatus,
    example: InstructionStatus.Pending,
  })
  readonly status: InstructionStatus;

  @ApiProperty({
    description: 'Date when the trade is performed',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly tradeDate: Date | null;

  @ApiProperty({
    description: 'Date when the value is transferred',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly valueDate: Date | null;

  @ApiPropertyOptional({
    description: 'Type of the Instruction',
    type: 'string',
    enum: InstructionType,
    example: InstructionType.SettleOnBlock,
  })
  readonly type?: InstructionType;

  @ApiPropertyOptional({
    description:
      'Block at which the Instruction is executed. This value will only be present for "SettleOnBlock" type Instruction',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  readonly endBlock?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Identifies the event where the Instruction execution was attempted. This value will not be present for a "Pending" Instruction',
  })
  @FromEntity()
  readonly eventIdentifier?: EventIdentifier;

  @ApiProperty({
    description: 'List of Legs in the Instruction',
    type: LegModel,
    isArray: true,
  })
  @Type(() => LegModel)
  readonly legs: LegModel[];

  constructor(model: InstructionModel) {
    Object.assign(this, model);
  }
}
