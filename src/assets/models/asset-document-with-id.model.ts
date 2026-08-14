/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AssetDocumentModel } from '~/assets/models/asset-document.model';
import { FromBigNumber } from '~/common/decorators/transformation';

export class AssetDocumentWithIdModel extends AssetDocumentModel {
  @ApiProperty({
    description: 'The on-chain ID of the document',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  constructor(model: AssetDocumentWithIdModel) {
    super(model);
    Object.assign(this, model);
  }
}
