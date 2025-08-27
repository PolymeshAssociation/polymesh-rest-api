import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType, TrustedFor } from '@polymeshassociation/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

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
    example: [
      ClaimType.Accredited,
      { type: ClaimType.Custom, customClaimTypeId: new BigNumber(1) },
    ],
    nullable: true,
  })
  readonly trustedFor: TrustedFor[] | null;

  constructor(model: TrustedClaimIssuerModel) {
    Object.assign(this, model);
  }
}
