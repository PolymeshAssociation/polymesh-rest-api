/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { BalanceModel } from '~/tokens/models/balance.model';
import { TokenDetailsModel } from '~/tokens/models/token-details.model';

export class TokenBalanceModel extends BalanceModel {
  @ApiProperty({
    description: 'Identity details of the issuer',
    type: TokenDetailsModel,
  })
  token: TokenDetailsModel;
}
