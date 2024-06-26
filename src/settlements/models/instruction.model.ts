/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { InstructionStatus, InstructionType, Venue } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { LegType } from '~/common/types';
import { AssetLegModel } from '~/settlements/models/asset-leg.model';
import { LegModel } from '~/settlements/models/leg.model';
import { MediatorAffirmationModel } from '~/settlements/models/mediator-affirmation.model';
import { OffChainLegModel } from '~/settlements/models/offchain-leg.model';

export class InstructionModel {
  @ApiProperty({
    description: 'ID of the Venue through which the settlement is handled',
    type: 'string',
    example: '123',
  })
  @FromEntity()
  readonly venue: Venue;

  @ApiProperty({
    description: 'Date when the Instruction was created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'The current status of the Instruction',
    type: 'string',
    enum: InstructionStatus,
    example: InstructionStatus.Pending,
  })
  readonly status: InstructionStatus;

  @ApiPropertyOptional({
    description: 'Date at which the trade was agreed upon (optional, for off chain trades)',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly tradeDate?: Date;

  @ApiPropertyOptional({
    description: 'Date at which the trade was executed (optional, for off chain trades)',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly valueDate?: Date;

  @ApiProperty({
    description: 'Type of the Instruction',
    type: 'string',
    enum: InstructionType,
    example: InstructionType.SettleOnBlock,
  })
  readonly type: InstructionType;

  @ApiPropertyOptional({
    description:
      'Block at which the Instruction is executed. This value will only be present for "SettleOnBlock" type Instruction',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  readonly endBlock?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Block after which the Instruction can be manually executed. This value will only be present for "SettleManual" type Instruction',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  readonly endAfterBlock?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Identifies the event where the Instruction execution was attempted. This value will not be present for a "Pending" Instruction',
    type: EventIdentifierModel,
  })
  @Type(() => EventIdentifierModel)
  readonly eventIdentifier?: EventIdentifierModel;

  @ApiPropertyOptional({
    description: 'Identifier string provided while creating the Instruction',
    example: 'Transfer of GROWTH Asset',
  })
  readonly memo?: string;

  @ApiPropertyOneOf({
    description: 'List of Legs in the Instruction',
    isArray: true,
    union: [LegModel, OffChainLegModel],
  })
  @Type(() => AssetLegModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: OffChainLegModel,
          name: LegType.offChain,
        },
        {
          value: LegModel,
          name: LegType.onChain,
        },
      ],
    },
  })
  readonly legs: (LegModel | OffChainLegModel)[];

  @ApiProperty({
    description: 'List of mediators involved in the Instruction',
    type: MediatorAffirmationModel,
    isArray: true,
  })
  readonly mediators: MediatorAffirmationModel[];

  constructor(model: InstructionModel) {
    Object.assign(this, model);
  }
}
