/* istanbul ignore file */

import { ApiExtraModels } from '@nestjs/swagger';
import {
  AddClaimCountStatParams,
  AddClaimPercentageStatParams,
  AddCountStatParams,
  AddPercentageStatParams,
} from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountAffiliateStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';
import { AddClaimPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-percentage-stat.dto';
import { AddCountStatDto } from '~/assets/dto/transfer-restrictions/stats/add-count-stat.dto';
import { AddPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-percentage-stat.dto';
import { AssetStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/asset-stat-base.dto';
import { ClaimCountAccreditedValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-accredited-value.dto';
import { ClaimCountAffiliateValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-affiliate-value.dto';
import { ClaimCountJurisdictionValueItemDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-jurisdiction-value-item.dto';
import { ApiPropertyOneOf } from '~/common/decorators';
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
  @ApiPropertyOneOf({
    description: 'Statistics to enable for transfer restrictions',
    isArray: true,
    union: [
      AddCountStatDto,
      AddPercentageStatDto,
      AddClaimCountAccreditedStatDto,
      AddClaimCountAffiliateStatDto,
      AddClaimCountJurisdictionStatDto,
      AddClaimPercentageStatDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => AssetStatBaseDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AddCountStatDto, name: 'Count' },
        { value: AddPercentageStatDto, name: 'Balance' },
        { value: AddClaimCountAccreditedStatDto, name: 'ScopedCount' },
        { value: AddClaimCountAffiliateStatDto, name: 'ScopedCount' },
        { value: AddClaimCountJurisdictionStatDto, name: 'ScopedCount' },
        { value: AddClaimPercentageStatDto, name: 'ScopedBalance' },
      ],
    },
  })
  readonly stats: (
    | AddCountStatParams
    | AddPercentageStatParams
    | AddClaimCountStatParams
    | AddClaimPercentageStatParams
  )[];
}
