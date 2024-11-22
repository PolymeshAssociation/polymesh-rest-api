/* istanbul ignore file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NftCollection } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedNftCollectionModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'The newly created NFT collection ID',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @FromEntity()
  readonly collection: NftCollection;

  constructor(model: CreatedNftCollectionModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
