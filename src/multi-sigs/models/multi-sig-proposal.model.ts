/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators';
import { MultiSigProposalDetailsModel } from '~/multi-sigs/models/multi-sig-proposal-details.model';

export class MultiSigProposalModel {
  @ApiProperty({
    description: 'The multiSig for which the proposal if for',
    type: 'string',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  readonly multiSigAddress: string;

  @ApiProperty({
    description: 'The ID of the proposal',
    example: '1',
  })
  @FromBigNumber()
  readonly proposalId: BigNumber;

  @ApiProperty({
    description: 'Proposal details',
    example: {
      approvalAmount: '1',
      rejectionAmount: '0',
      status: 'Active',
      expiry: null,
      autoClose: true,
      args: {
        ticker: '0x5449434b4552000000000000',
        amount: 1000000000,
        portfolio_kind: {
          default: null,
        },
      },
      txTag: 'asset.issue',
      voted: ['5EyGPbr94Hw2r5kYR4eW21U9CuNwW87pk2bpkR5WGE2STK2r'],
    },
  })
  readonly details: MultiSigProposalDetailsModel;

  constructor(model: MultiSigProposalModel) {
    const { details: rawDetails, ...rest } = model;
    const details = new MultiSigProposalDetailsModel(rawDetails);

    Object.assign(this, { ...rest, details });
  }
}
