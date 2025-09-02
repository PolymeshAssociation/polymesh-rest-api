/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AddClaimCountStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-stat-base.dto';
import { ClaimCountJurisdictionValueItemDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-jurisdiction-value-item.dto';

export class AddClaimCountJurisdictionStatDto extends AddClaimCountStatBaseDto {
  declare readonly claimType: ClaimType.Jurisdiction;

  @ApiProperty({
    description: 'Counts per jurisdiction',
    isArray: true,
    type: ClaimCountJurisdictionValueItemDto,
  })
  @ValidateNested({ each: true })
  @Type(() => ClaimCountJurisdictionValueItemDto)
  readonly value: ClaimCountJurisdictionValueItemDto[];
}
