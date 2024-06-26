/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Instruction } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { LegType } from '~/common/types';
import { AssetLegModel } from '~/settlements/models/asset-leg.model';
import { LegModel } from '~/settlements/models/leg.model';
import { OffChainLegModel } from '~/settlements/models/offchain-leg.model';

@ApiExtraModels(LegModel, OffChainLegModel)
export class CreatedInstructionModel extends TransactionQueueModel {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created settlement Instruction',
    example: '123',
  })
  @FromEntity()
  readonly instruction: Instruction;

  @ApiPropertyOneOf({
    description: 'List of Legs in the Instruction',
    union: [LegModel, OffChainLegModel],
    discriminator: {
      propertyName: 'type',
      mapping: {
        [LegType.onChain]: getSchemaPath(LegModel),
        [LegType.offChain]: getSchemaPath(OffChainLegModel),
      },
    },
    isArray: true,
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

  constructor(model: CreatedInstructionModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
