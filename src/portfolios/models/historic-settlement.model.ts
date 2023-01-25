/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { SettlementResultEnum } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { AccountDataModel } from '~/identities/models/account-data.model';
import { SettlementLegModel } from '~/portfolios/models/settlement-leg.model';

export class HistoricSettlementModel {
  @ApiProperty({
    description: 'Block number of the settlement transaction',
    example: new BigNumber(1),
  })
  @FromBigNumber()
  readonly blockNumber: BigNumber;

  @ApiProperty({
    description: 'Block hash of the settlement transaction',
    example: '0x01',
  })
  readonly blockHash: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: SettlementResultEnum,
    example: SettlementResultEnum.Executed,
  })
  readonly status: string;

  @ApiProperty({
    description: 'Transaction hash',
    example: ['0x01'],
    type: AccountDataModel,
    isArray: true,
  })
  @Type(() => AccountDataModel)
  readonly accounts: AccountDataModel[];

  @ApiProperty({
    description: 'Transaction settlement legs',
    type: SettlementLegModel,
    isArray: true,
  })
  @Type(() => SettlementLegModel)
  readonly legs: SettlementLegModel[];

  constructor(model: HistoricSettlementModel) {
    Object.assign(this, model);
  }
}
