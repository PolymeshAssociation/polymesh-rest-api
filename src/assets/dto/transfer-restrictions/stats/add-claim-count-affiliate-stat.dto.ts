/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AddClaimCountStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-stat-base.dto';
import { ClaimCountAffiliateValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-affiliate-value.dto';

export class AddClaimCountAffiliateStatDto extends AddClaimCountStatBaseDto {
  declare readonly claimType: ClaimType.Affiliate;

  @ApiProperty({ description: 'Counts for affiliate vs non-affiliate investors' })
  @ValidateNested()
  @Type(() => ClaimCountAffiliateValueDto)
  readonly value: ClaimCountAffiliateValueDto;
}
