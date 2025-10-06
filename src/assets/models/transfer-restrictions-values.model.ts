/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import type {
  ClaimValue,
  JurisdictionValue,
} from '@polymeshassociation/polymesh-sdk/api/entities/Asset/types';
import {
  ClaimType,
  CountryCode,
  StatType,
  TransferRestrictionStatValues,
  TrustedFor,
} from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ApiPropertyOneOf } from '~/common/decorators';
import { FromBigNumber } from '~/common/decorators/transformation';

type SerializedCustomClaimType = {
  type: ClaimType.Custom;
  customClaimTypeId: string;
};

function serializeClaimType(claimType: TrustedFor): TrustedFor | SerializedCustomClaimType {
  if (
    typeof claimType === 'object' &&
    claimType !== null &&
    'type' in claimType &&
    claimType.type === ClaimType.Custom &&
    'customClaimTypeId' in claimType
  ) {
    const { customClaimTypeId } = claimType as { customClaimTypeId: BigNumber | string | number };

    return {
      type: ClaimType.Custom,
      customClaimTypeId:
        customClaimTypeId instanceof BigNumber
          ? customClaimTypeId.toString()
          : String(customClaimTypeId),
    };
  }

  return claimType;
}

export class TransferRestrictionClaimValueBreakdownModel {
  @ApiProperty({
    description:
      'Number of individual Asset holders (or total balance) that possess the associated claim',
    type: 'string',
    example: '75',
  })
  readonly withClaim: string;

  @ApiProperty({
    description:
      'Number of individual Asset holders (or total balance) that do not possess the associated claim',
    type: 'string',
    example: '25',
  })
  readonly withoutClaim: string;

  constructor(value: ClaimValue) {
    this.withClaim = value.withClaim.toString();
    this.withoutClaim = value.withoutClaim.toString();
  }
}

export class TransferRestrictionJurisdictionBreakdownModel {
  @ApiProperty({
    description: 'Country code that identifies the jurisdiction (null means no jurisdiction claim)',
    enum: CountryCode,
    nullable: true,
    example: CountryCode.Us,
  })
  readonly countryCode: CountryCode | null;

  @ApiProperty({
    description:
      'Number of individual Asset holders (or total balance) that fall under this jurisdiction',
    type: 'string',
    example: '10',
  })
  readonly value: string;

  constructor(value: JurisdictionValue) {
    this.countryCode = value.countryCode;
    this.value = value.value.toString();
  }
}

@ApiExtraModels(
  TransferRestrictionClaimValueBreakdownModel,
  TransferRestrictionJurisdictionBreakdownModel
)
export class TransferRestrictionClaimDetailsModel {
  @ApiProperty({
    description: 'DID of the Identity that issued the claim associated with the restriction',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly issuer: string;

  @ApiPropertyOneOf({
    description: 'Claim type that scopes the transfer restriction statistic',
    union: [
      {
        type: 'string',
        enum: Object.values(ClaimType),
        example: ClaimType.Accredited,
      },
      {
        type: 'object',
        properties: {
          type: { type: 'string', enum: [ClaimType.Custom] },
          customClaimTypeId: { type: 'string', example: '1' },
        },
        example: {
          type: ClaimType.Custom,
          customClaimTypeId: '1',
        },
      },
    ],
  })
  readonly claimType: TrustedFor | SerializedCustomClaimType;

  @ApiPropertyOneOf({
    description:
      'Breakdown of holders or balances for the statistic. Jurisdiction claims include an entry per country code, while other claims display holders with/without the claim.',
    union: [
      TransferRestrictionClaimValueBreakdownModel,
      {
        type: 'array',
        items: { $ref: getSchemaPath(TransferRestrictionJurisdictionBreakdownModel) },
      },
    ],
  })
  readonly value?:
    | TransferRestrictionClaimValueBreakdownModel
    | TransferRestrictionJurisdictionBreakdownModel[];

  constructor(model: NonNullable<TransferRestrictionStatValues['claim']>) {
    const { issuer, claimType, value } = model;

    this.issuer = issuer.did;
    this.claimType = serializeClaimType(claimType);

    if (value) {
      if (Array.isArray(value)) {
        this.value = value.map(entry => new TransferRestrictionJurisdictionBreakdownModel(entry));
      } else {
        this.value = new TransferRestrictionClaimValueBreakdownModel(value);
      }
    }
  }
}

@ApiExtraModels(
  TransferRestrictionClaimDetailsModel,
  TransferRestrictionClaimValueBreakdownModel,
  TransferRestrictionJurisdictionBreakdownModel
)
export class TransferRestrictionsValueModel {
  @ApiProperty({
    description: 'Type of transfer restriction statistic',
    enum: StatType,
    example: StatType.Count,
  })
  readonly type: StatType;

  @ApiPropertyOptional({
    description: 'Claim details (present for scoped statistics only)',
    type: TransferRestrictionClaimDetailsModel,
  })
  @Type(() => TransferRestrictionClaimDetailsModel)
  readonly claim?: TransferRestrictionClaimDetailsModel;

  @ApiProperty({
    description:
      'Aggregate value for the statistic. For scoped statistics, this represents the total across all claim groups.',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly value: BigNumber;

  constructor(model: TransferRestrictionStatValues) {
    const { type, value, claim } = model;

    this.type = type;
    this.value = value;

    if (claim) {
      this.claim = new TransferRestrictionClaimDetailsModel(claim);
    }
  }
}
