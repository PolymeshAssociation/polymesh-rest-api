/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { InstructionStatus } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { EventIdentifierDto } from '~/common/dto/event-identifier.dto';

export class InstructionStatusDto {
  @ApiProperty({
    examples: [InstructionStatus.Pending, InstructionStatus.Executed, InstructionStatus.Failed],
    enum: InstructionStatus,
  })
  readonly status: string;

  @ApiProperty({
    nullable: true,
    description:
      'Identifies the event where the Instruction execution was attempted. This value will not be present for a "Pending" Instruction',
  })
  @Type(() => EventIdentifierDto)
  readonly eventIdentifier?: EventIdentifierDto;

  constructor(dto: InstructionStatusDto) {
    Object.assign(this, dto);
  }
}
