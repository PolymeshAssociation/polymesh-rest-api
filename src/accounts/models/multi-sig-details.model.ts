/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { SignerModel } from '~/identities/models/signer.model';

export class MultiSigDetailsModel {
  @ApiProperty({
    description: 'Signing accounts for the multiSig',
    isArray: true,
    type: SignerModel,
  })
  @Type(() => SignerModel)
  readonly signers: SignerModel[];

  @ApiProperty({
    description: 'The required number of signers needed to approve a proposal',
    type: 'string',
    example: '2',
  })
  @FromBigNumber()
  readonly requiredSignatures: BigNumber;

  constructor(model: MultiSigDetailsModel) {
    Object.assign(this, model);
  }
}
