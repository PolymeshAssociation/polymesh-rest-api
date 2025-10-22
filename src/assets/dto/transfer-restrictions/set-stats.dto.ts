/* istanbul ignore file */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  AddClaimCountStatParams,
  AddClaimPercentageStatParams,
  AddCountStatParams,
  AddPercentageStatParams,
} from '@polymeshassociation/polymesh-sdk/types';
import { ValidateNested } from 'class-validator';

import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountAffiliateStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';
import { AddClaimPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-percentage-stat.dto';
import { AddCountStatDto } from '~/assets/dto/transfer-restrictions/stats/add-count-stat.dto';
import { AddPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-percentage-stat.dto';
import { ClaimCountAccreditedValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-accredited-value.dto';
import { ClaimCountAffiliateValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-affiliate-value.dto';
import { ClaimCountJurisdictionValueItemDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-jurisdiction-value-item.dto';
import { TransformScopedCountStats } from '~/common/decorators/scoped-count-transformer';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TrustedForCustomClaimDto } from '~/compliance/dto/trusted-for-custom-claim.dto';

@ApiExtraModels(
  AddCountStatDto,
  AddPercentageStatDto,
  AddClaimCountAccreditedStatDto,
  AddClaimCountAffiliateStatDto,
  AddClaimCountJurisdictionStatDto,
  AddClaimPercentageStatDto,
  ClaimCountAccreditedValueDto,
  ClaimCountAffiliateValueDto,
  ClaimCountJurisdictionValueItemDto,
  TrustedForCustomClaimDto
)
export class SetStatsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Statistics to enable for transfer restrictions',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/AddCountStatDto' },
        { $ref: '#/components/schemas/AddPercentageStatDto' },
        { $ref: '#/components/schemas/AddClaimCountAccreditedStatDto' },
        { $ref: '#/components/schemas/AddClaimCountAffiliateStatDto' },
        { $ref: '#/components/schemas/AddClaimCountJurisdictionStatDto' },
        { $ref: '#/components/schemas/AddClaimPercentageStatDto' },
      ],
    },
    example: [
      {
        type: 'Count',
        count: '100',
      },
      {
        type: 'Balance',
      },
      {
        type: 'ScopedCount',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claimType: 'Accredited',
        value: {
          accredited: '10',
          nonAccredited: '90',
        },
      },
      {
        type: 'ScopedCount',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claimType: 'Affiliate',
        value: {
          affiliate: '5',
          nonAffiliate: '95',
        },
      },
      {
        type: 'ScopedCount',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claimType: 'Jurisdiction',
        value: [
          {
            countryCode: 'Af',
            count: '25',
          },
        ],
      },
      {
        type: 'ScopedBalance',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claimType: 'Accredited',
      },
    ],
  })
  @ValidateNested({ each: true })
  @TransformScopedCountStats()
  readonly stats: (
    | AddCountStatParams
    | AddPercentageStatParams
    | AddClaimCountStatParams
    | AddClaimPercentageStatParams
  )[];
}
