/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class SenderProofVerificationResponseModel {
  @ApiProperty({
    description: 'Indicates if the sender proof was valid',
    type: 'boolean',
    example: true,
  })
  readonly isValid: boolean;

  @ApiProperty({
    description: 'Amount specified in the in the transaction',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'Indicates if the sender proof was valid',
    type: 'boolean',
    example: 'Invalid proof: TransactionAmountMismatch { expected_amount: 1000 }',
    nullable: true,
  })
  readonly errMsg: string | null;

  constructor(model: SenderProofVerificationResponseModel) {
    Object.assign(this, model);
  }
}
