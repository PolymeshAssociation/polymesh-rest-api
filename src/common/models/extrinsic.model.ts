/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ExtrinsicData, TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';
import { getTxTags } from '~/common/utils';

export class ExtrinsicModel {
  @ApiProperty({
    description: 'Hash of the block where the transaction resides',
    type: 'string',
    example: '0x9d05973b0bacdbf26b705358fbcb7085354b1b7836ee1cc54e824810479dccf6',
  })
  readonly blockHash: string;

  @ApiProperty({
    description: 'Number of the block where the transaction resides',
    type: 'string',
    example: '1000000',
  })
  @FromBigNumber()
  readonly blockNumber: BigNumber;

  @ApiProperty({
    description: 'Index of the transaction in the block',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly extrinsicIdx: BigNumber;

  @ApiProperty({
    description:
      'Public key of the signer. Unsigned transactions have no signer, in which case this value is null (example: an enacted governance proposal)',
    type: 'string',
    nullable: true,
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  readonly address: string | null;

  @ApiProperty({
    description: 'Nonce of the transaction. Null for unsigned transactions where address is null',
    type: 'string',
    nullable: true,
    example: '123456',
  })
  @FromBigNumber()
  readonly nonce: BigNumber | null;

  @ApiProperty({
    description:
      'Transaction type identifier (for UI purposes). The format is <palletName>.<transactionName>',
    type: 'string',
    enum: getTxTags(),
    example: TxTags.asset.RegisterUniqueTicker,
  })
  readonly transactionTag: TxTag;

  @ApiProperty({
    description: 'List of parameters associated with the transaction',
    isArray: true,
    example: [
      {
        name: 'asset',
        value: '0xa3616b82e8e1080aedc952ea28b9db8b',
      },
    ],
  })
  readonly params: Record<string, unknown>[];

  @ApiProperty({
    description: 'Indicates whether the transaction was successful or not',
    type: 'boolean',
    example: true,
  })
  readonly success: boolean;

  @ApiProperty({
    description: 'Spec version of the chain',
    type: 'string',
    example: '3002',
  })
  @FromBigNumber()
  readonly specVersionId: BigNumber;

  @ApiProperty({
    description: 'Hash of the transaction',
    type: 'string',
    example: '44b8a09e9647b34d81d9eb40f26c5bb35ea216610a03df71978558ec939d5120',
  })
  readonly extrinsicHash: string;

  constructor(data: ExtrinsicData) {
    const { txTag: transactionTag, ...rest } = data;
    Object.assign(this, { ...rest, transactionTag });
  }
}
