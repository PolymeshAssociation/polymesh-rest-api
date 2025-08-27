import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { ClaimType, TrustedFor } from '@polymeshassociation/polymesh-sdk/types';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { ToTrustedFor } from '~/common/decorators/transformation';
import { IsDid, IsTrustedForClaimType } from '~/common/decorators/validation';
import { TrustedForCustomClaimDto } from '~/compliance/dto/trusted-for-custom-claim.dto';

@ApiExtraModels(TrustedForCustomClaimDto)
export class TrustedClaimIssuerDto {
  @ApiPropertyOneOf({
    description:
      'List of Claim types for which an Identity is trusted for verifying. Defaults to all types',
    isArray: true,
    nullable: true,
    default: null,
    union: [
      {
        type: 'string',
        enum: Object.values(ClaimType).filter(claimType => claimType !== ClaimType.Custom),
      },
      TrustedForCustomClaimDto,
    ],
  })
  @ToTrustedFor({ each: true })
  @IsTrustedForClaimType({ each: true })
  readonly trustedFor: TrustedFor[] | null;

  @ApiProperty({
    description: 'The Identity of the Claim Issuer',
    type: 'string',
  })
  @IsDid()
  readonly identity: string;
}
