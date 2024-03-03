/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ConfidentialLegParty,
  ConfidentialTransaction,
} from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class ConfidentialAffirmationModel {
  @ApiProperty({
    description: 'Confidential Asset ID being transferred in the leg',
    type: 'string',
    example: '10',
  })
  @FromEntity()
  readonly transaction: ConfidentialTransaction;

  @ApiProperty({
    description: 'Index of the leg for which the affirmation was given',
    type: 'string',
    example: '0',
  })
  @FromBigNumber()
  readonly legId: BigNumber;

  @ApiProperty({
    description: 'Affirming party',
    type: ConfidentialLegParty,
    example: ConfidentialLegParty.Auditor,
  })
  readonly role: ConfidentialLegParty;

  @ApiProperty({
    description: 'Indicates whether the leg was affirmed or not',
    type: 'boolean',
    example: true,
  })
  readonly affirmed: boolean;

  constructor(model: ConfidentialAffirmationModel) {
    Object.assign(this, model);
  }
}
