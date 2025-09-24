/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTag } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';
import { getTxTags } from '~/common/utils';

type ProtocolFeeModelParams = {
  tag: TxTag;
  fee: BigNumber;
};

export class ProtocolFeeModel {
  @ApiProperty({
    description: 'Transaction tag the fee applies to',
    enum: getTxTags(),
    example: 'asset.createAsset',
  })
  readonly tag: TxTag;

  @ApiProperty({
    description: 'Protocol fee amount in POLYX',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly fee: BigNumber;

  constructor(model: ProtocolFeeModelParams) {
    Object.assign(this, model);
  }
}
