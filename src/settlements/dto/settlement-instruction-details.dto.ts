/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { InstructionStatus, InstructionType, Venue } from '@polymathnetwork/polymesh-sdk/types';
import { Transform } from 'class-transformer';

export class SettlementInstructionDetailsDto {
  @ApiProperty({
    example: InstructionStatus.Pending,
  })
  status: string;

  @ApiProperty({
    example: new Date('10/14/1987'),
  })
  createdAt: Date;

  @ApiProperty({
    example: new Date('10/14/1987'),
    description: 'Date at which the trade was agreed upon (optional, for offchain trades)',
  })
  tradeDate: Date | null;

  @ApiProperty({
    example: new Date('10/14/1987'),
    description: 'Date at which the trade was executed (optional, for offchain trades)',
  })
  valueDate: Date | null;

  @ApiProperty({
    type: 'string',
    example: '10',
  })
  @Transform(({ value }) => value.id.toString())
  venue: Venue;

  @ApiProperty({
    example: InstructionType.SettleOnAffirmation,
    description:
      'Whether the Instruction is settled when all parties have affirmed it (SettleOnAffirmation), or on a specific block (SettleOnBlock)',
  })
  type: string;

  @ApiProperty({
    example: '1234',
    description:
      'Block at which the instruction will be settled (only applicable if "type" is "SettleOnBlock")',
  })
  endBlock: BigNumber | null;

  constructor(dto: SettlementInstructionDetailsDto) {
    Object.assign(this, dto);
  }
}
