/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RequiredMediatorsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The identities to make required mediators for the asset',
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
    type: 'string',
    isArray: true,
  })
  @IsDid({ each: true })
  readonly mediators: string[];
}
