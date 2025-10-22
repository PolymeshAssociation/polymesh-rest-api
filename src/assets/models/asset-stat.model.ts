/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStat, StatClaimIssuer, StatType } from '@polymeshassociation/polymesh-sdk/types';

export class StatClaimIssuerModel {
  @ApiProperty({
    description: 'The Identity that issued the claim',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly issuer: string;

  @ApiProperty({
    description: 'Type of claim',
    example: 'Accredited',
  })
  readonly claimType: string;

  constructor(model: StatClaimIssuer) {
    // Extract the DID from the issuer Identity
    this.issuer = model.issuer.did;

    // Handle TrustedFor type which can be ClaimType or custom claim object
    if (typeof model.claimType === 'string') {
      this.claimType = model.claimType;
    } else if (
      model.claimType &&
      typeof model.claimType === 'object' &&
      'type' in model.claimType
    ) {
      this.claimType = model.claimType.type;
    } else {
      this.claimType = 'Unknown';
    }
  }
}

export class AssetStatModel {
  @ApiProperty({
    description: 'Type of statistic',
    enum: StatType,
    example: StatType.Count,
  })
  readonly type: StatType;

  @ApiPropertyOptional({
    description: 'Claim issuer for scoped statistics (ScopedCount or ScopedBalance)',
    type: StatClaimIssuerModel,
  })
  readonly claimIssuer?: StatClaimIssuerModel;

  constructor(model: AssetStat) {
    this.type = model.type;

    // Handle claimIssuer for scoped statistics
    if (model.claimIssuer) {
      this.claimIssuer = new StatClaimIssuerModel(model.claimIssuer);
    }
  }
}
