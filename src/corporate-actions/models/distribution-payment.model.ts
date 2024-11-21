/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators';

export class DistributionPaymentModel {
  @ApiProperty({
    description: 'Block number when the payment was made',
    type: 'string',
    example: '1234567',
  })
  @FromBigNumber()
  blockNumber: BigNumber;

  @ApiProperty({
    description: 'Hash of the block when the payment was made',
    type: 'string',
    example: '0xec1d41dd553ce03c3e462aab8bcfba0e1726e6bf310db6e06a933bf0430419c0',
  })
  blockHash: string;

  @ApiProperty({
    description: 'Date when the payment was made',
    example: new Date('10/14/1987').toISOString(),
    type: 'string',
  })
  date: Date;

  @ApiProperty({
    description: 'The DID of the payment recipient',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  did: string;

  @ApiProperty({
    description: 'Amount of the payment',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  amount: BigNumber;

  @ApiProperty({
    description: 'Percentage (0-100) of tax withholding for the target identity',
    type: 'string',
    example: '15',
  })
  @FromBigNumber()
  withheldTax: BigNumber;

  constructor(model: DistributionPaymentModel) {
    Object.assign(this, model);
  }
}
