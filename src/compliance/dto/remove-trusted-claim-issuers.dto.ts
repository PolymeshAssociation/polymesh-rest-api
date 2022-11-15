/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RemoveTrustedClaimIssuersDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The list of Claim issuer identities that should be removed',
    isArray: true,
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
  })
  @IsNotEmpty()
  @IsDid({ each: true })
  readonly claimIssuers: string[];
}
