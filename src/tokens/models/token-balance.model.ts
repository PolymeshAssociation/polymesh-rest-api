/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { BalanceModel } from '~/tokens/models/balance.model';

export class TokenBalanceModel extends BalanceModel {
  @ApiProperty({
    description: 'Ticker of the token',
    type: 'string',
    example: 'TICKER',
  })
  @FromEntity()
  readonly token?: SecurityToken;

  constructor(model: TokenBalanceModel) {
    const { token, ...balance } = model;
    super(balance);
    this.token = token;
  }
}
