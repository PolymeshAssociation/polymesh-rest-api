/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AffirmAsMediatorDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'An optional date, after which the affirmation will be voided',
    type: Date,
    example: new Date('10/14/2055').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
