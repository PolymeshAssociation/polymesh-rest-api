import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class TrustedForCustomClaimDto {
  @ApiProperty({
    description: 'The Custom Claim Type ID of the Claim Issuer',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly customClaimTypeId: BigNumber;

  @ApiProperty({
    description: 'The type of claim - always Custom for this DTO',
    enum: [ClaimType.Custom],
    example: ClaimType.Custom,
  })
  readonly type: ClaimType.Custom;
}
