/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  TransferRestrictionType,
  TransferRestrictionValues,
} from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { TransferRestrictionModel } from '~/assets/models/transfer-restriction.model';
import { TransferRestrictionClaimCountModel } from '~/assets/models/transfer-restriction-claim-count.model';
import { TransferRestrictionClaimPercentageModel } from '~/assets/models/transfer-restriction-claim-percentage.model';
import { TransferRestrictionCountModel } from '~/assets/models/transfer-restriction-count.model';
import { TransferRestrictionPercentageModel } from '~/assets/models/transfer-restriction-percentage.model';
import { ApiPropertyOneOf } from '~/common/decorators';
import { FromBigNumber } from '~/common/decorators/transformation';

export class TransferRestrictionsValueModel {
  @ApiPropertyOneOf({
    description: 'The transfer restriction',
    union: [
      TransferRestrictionCountModel,
      TransferRestrictionPercentageModel,
      TransferRestrictionClaimCountModel,
      TransferRestrictionClaimPercentageModel,
    ],
  })
  @Type(() => TransferRestrictionModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: TransferRestrictionCountModel,
          name: TransferRestrictionType.Count,
        },
        {
          value: TransferRestrictionPercentageModel,
          name: TransferRestrictionType.Percentage,
        },
        {
          value: TransferRestrictionClaimCountModel,
          name: TransferRestrictionType.ClaimCount,
        },
        {
          value: TransferRestrictionClaimPercentageModel,
          name: TransferRestrictionType.ClaimPercentage,
        },
      ],
    },
  })
  readonly restriction: TransferRestrictionModel;

  @ApiProperty({
    description: 'The current value (count or percentage) of the transfer restriction',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly value: BigNumber;

  constructor(model: TransferRestrictionValues) {
    Object.assign(this, model);
  }
}
