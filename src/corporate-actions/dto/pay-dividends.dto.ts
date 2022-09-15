import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class PayDividendsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'DIDs of the target Identities',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  @IsDid({ each: true })
  readonly targets: string[];
}
