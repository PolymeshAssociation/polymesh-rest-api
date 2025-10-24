/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AbdicateAgentDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The DID of the Identity that will abdicate its permissions for the Asset',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly identity: string;
}
