import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';

export class TrustedClaimIssuerModel {
  @ApiProperty({
    description: 'DID of the Claim Issuer',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiPropertyOptional({
    description:
      'List of Claim types for which this Claim Issuer is trusted. A null value means that the issuer is trusted for all Claim types',
    type: 'string',
    enum: ClaimType,
    isArray: true,
    example: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
  })
  readonly trustedFor: ClaimType[] | null;

  constructor(model: TrustedClaimIssuerModel) {
    Object.assign(this, model);
  }
}
