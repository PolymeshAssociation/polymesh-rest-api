import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RemoveTrustedClaimIssuers extends TransactionBaseDto {
  @ApiProperty({
    description: 'The list of Claim issuer identities that should be removed',
    isArray: true,
    example: {
      signer: 'Alice',
      claimIssuers: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
    },
  })
  @IsNotEmpty()
  @IsArray()
  readonly claimIssuers: string[];
}
