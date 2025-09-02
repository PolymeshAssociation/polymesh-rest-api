/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, StatType, TrustedFor } from '@polymeshassociation/polymesh-sdk/types';

import { AssetStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/asset-stat-base.dto';
import { ApiPropertyOneOf } from '~/common/decorators';
import { ToTrustedFor } from '~/common/decorators/transformation';
import { IsDid, IsTrustedForClaimType } from '~/common/decorators/validation';
import { TrustedForCustomClaimDto } from '~/compliance/dto/trusted-for-custom-claim.dto';

export class AddClaimPercentageStatDto extends AssetStatBaseDto {
  declare readonly type: StatType.ScopedBalance;

  @ApiProperty({
    description: 'The DID of the claim issuer for the scoped percentage stat',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly issuer: string;

  @ApiPropertyOneOf({
    description:
      'The claim type for which the percentage stat is scoped. Either a built-in ClaimType or a custom claim object',
    union: [
      {
        type: 'string',
        enum: Object.values(ClaimType).filter(c => c !== ClaimType.Custom),
      },
      TrustedForCustomClaimDto,
    ],
  })
  @ToTrustedFor()
  @IsTrustedForClaimType()
  readonly claimType: TrustedFor;
}
