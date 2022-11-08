/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TrustedClaimIssuerDto } from '~/compliance/dto/trusted-claim-issuer.dto';

export class SetTrustedClaimIssuersDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'The list of Claim Issuers that will be trusted to issue Claims of the specified type',
    isArray: true,
    type: TrustedClaimIssuerDto,
    example: [
      {
        identity: '0x0600000000000000000000000000000000000000000000000000000000000000',
        trustedFor: [ClaimType.Accredited, ClaimType.KnowYourCustomer],
      },
    ],
  })
  @Type(() => TrustedClaimIssuerDto)
  @IsNotEmpty()
  @ValidateNested({ each: true })
  readonly claimIssuers: TrustedClaimIssuerDto[];
}
