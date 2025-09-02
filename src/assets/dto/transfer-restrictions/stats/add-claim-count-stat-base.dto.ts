/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, StatType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { AssetStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/asset-stat-base.dto';
import { IsDid } from '~/common/decorators/validation';

export class AddClaimCountStatBaseDto extends AssetStatBaseDto {
  declare readonly type: StatType.ScopedCount;

  @ApiProperty({
    description: 'The DID of the claim issuer for the scoped stat',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly issuer: string;

  @ApiProperty({
    description: 'The claim type for the scoped count stat',
    enum: [ClaimType.Accredited, ClaimType.Affiliate, ClaimType.Jurisdiction],
    example: ClaimType.Accredited,
  })
  @IsEnum(ClaimType)
  readonly claimType: ClaimType.Accredited | ClaimType.Affiliate | ClaimType.Jurisdiction;
}
