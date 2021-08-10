/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  StoBalanceStatus,
  StoSaleStatus,
  StoStatus,
  StoTimingStatus,
  Venue,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { TierModel } from '~/offerings/models/tier.model';

export class OfferingDetailsModel {
  @ApiProperty({
    description: 'ID of the Offering',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The DID of the creator Identity',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly creator: Identity;

  @ApiProperty({
    description: 'Name of the Offering',
    type: 'string',
    example: 'SERIES A',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Portfolio containing the Asset being offered',
    example: {
      did: '0x0000000000000000000000000000000000000000000000000000000000000000',
      id: '1',
    },
  })
  @FromEntity()
  readonly offeringPortfolio: NumberedPortfolio | DefaultPortfolio;

  @ApiProperty({
    description: 'Portfolio receiving the Asset being raised',
  })
  @FromEntity()
  readonly raisingPortfolio: NumberedPortfolio | DefaultPortfolio;

  @ApiProperty({
    description: 'Currency in which payment is received',
    type: 'string',
    example: 'CURR',
  })
  readonly raisingCurrency: string;

  @ApiProperty({
    description: 'The Tiers of the Offerings',
    type: TierModel,
    isArray: true,
  })
  @Type(() => TierModel)
  readonly tiers: TierModel[];

  @ApiProperty({
    description: 'The Venue used for raising the Asset',
  })
  @FromEntity()
  readonly venue: Venue;

  @ApiProperty({
    description: 'Start time of the Offering',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly start: Date;

  @ApiProperty({
    description: 'End time of the Offering',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly end: Date | null;

  @ApiProperty({
    description: 'Status of the Offering',
    example: {
      timing: StoTimingStatus.Started,
      balance: StoBalanceStatus.Available,
      sale: StoSaleStatus.Live,
    },
  })
  readonly status: StoStatus;

  @ApiProperty({
    description: 'Minimum raising amount per transaction',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly minInvestment: BigNumber;

  @ApiProperty({
    description: 'Total amount to be raised',
    type: 'string',
    example: '10000',
  })
  @FromBigNumber()
  readonly totalAmount: BigNumber;

  @ApiProperty({
    description: 'Total amount remaining for purchase',
    type: 'string',
    example: '10000',
  })
  @FromBigNumber()
  readonly totalRemaining: BigNumber;

  constructor(model: OfferingDetailsModel) {
    Object.assign(this, model);
  }
}
