import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AnyJson,
  ProposalStatus,
  TxTag,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntityObject } from '~/common/decorators';
import { getTxTags } from '~/common/utils';

export class MultiSigProposalDetailsModel {
  @ApiProperty({
    description: 'The number of approvals this proposal has received',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  approvalAmount: BigNumber;

  @ApiProperty({
    description: 'The number of rejections this proposal has received',
    type: 'string',
    example: '0',
  })
  @FromBigNumber()
  rejectionAmount: BigNumber;

  @ApiProperty({
    description: 'The current status of the proposal',
    enum: ProposalStatus,
    type: 'string',
    example: ProposalStatus.Active,
  })
  readonly status: string;

  @ApiProperty({
    description:
      "An optional time in which this proposal will expire if a decision isn't reached by then",
    example: null,
  })
  readonly expiry: Date | null;

  @ApiProperty({
    description:
      'Determines if the proposal will automatically be closed once a threshold of reject votes has been reached',
    type: 'boolean',
    example: true,
  })
  readonly autoClose: boolean;

  @ApiProperty({
    description: 'The tag for the transaction being proposed for the MultiSig to execute',
    type: 'string',
    enum: getTxTags(),
    example: TxTags.asset.Issue,
  })
  readonly txTag: TxTag;

  @ApiProperty({
    description: 'The arguments to be passed to the transaction for this proposal',
    type: 'string',
    example: {
      ticker: '0x5449434b4552000000000000',
      amount: 1000000000,
      portfolio_kind: {
        default: null,
      },
    },
  })
  readonly args: AnyJson;

  @ApiProperty({
    description: 'Accounts of signing keys that have already voted on this proposal',
    isArray: true,
    type: 'string',
    example: ['5EyGPbr94Hw2r5kYR4eW21U9CuNwW87pk2bpkR5WGE2STK2r'],
  })
  @FromEntityObject()
  voted: Account[];

  constructor(model: MultiSigProposalDetailsModel) {
    Object.assign(this, model);
  }
}
