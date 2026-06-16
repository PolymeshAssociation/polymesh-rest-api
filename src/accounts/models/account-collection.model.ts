/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AccountCollection } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class AccountCollectionModel {
  @ApiProperty({
    description: 'The NFT collection held by the Account',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @FromEntity()
  readonly collection: AccountCollection['collection'];

  @ApiProperty({
    description: 'Total number of NFTs held for the collection',
    type: 'string',
    example: '5',
  })
  @FromBigNumber()
  readonly total: BigNumber;

  constructor(model: AccountCollectionModel) {
    Object.assign(this, model);
  }
}

export function createAccountCollectionModel(
  accountCollection: AccountCollection
): AccountCollectionModel {
  return new AccountCollectionModel({
    collection: accountCollection.collection,
    total: accountCollection.total,
  });
}
