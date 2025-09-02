/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AddClaimCountStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-stat-base.dto';
import { ClaimCountAccreditedValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-accredited-value.dto';

export class AddClaimCountAccreditedStatDto extends AddClaimCountStatBaseDto {
  declare readonly claimType: ClaimType.Accredited;

  @ApiProperty({ description: 'Counts for accredited vs non-accredited investors' })
  @ValidateNested()
  @Type(() => ClaimCountAccreditedValueDto)
  readonly value: ClaimCountAccreditedValueDto;
}
