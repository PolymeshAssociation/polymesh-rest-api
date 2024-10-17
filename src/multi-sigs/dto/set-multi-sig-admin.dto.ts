/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class SetMultiSigAdminDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The DID of the MultiSig Admin',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly admin: string;
}
