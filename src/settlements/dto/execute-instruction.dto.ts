/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ExecuteInstructionDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description: 'Set to `true` to skip affirmation check, useful for batch transactions',
    type: 'boolean',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly skipAffirmationCheck?: boolean;
}
