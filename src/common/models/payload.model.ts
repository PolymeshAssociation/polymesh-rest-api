/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class PayloadModel {
  @ApiProperty({
    type: 'string',
    description: 'The transaction spec version. This changes when the chain gets upgraded',
    example: '0x005b8d84',
  })
  readonly specVersion: string;

  @ApiProperty({
    type: 'string',
    description: 'The transaction version',
    example: '0x00000004',
  })
  readonly transactionVersion: string;

  @ApiProperty({
    type: 'string',
    description: 'The signing address',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  readonly address: string;

  @ApiProperty({
    type: 'string',
    description:
      'The latest block hash when this transaction was created. Used to control transaction lifetime',
    example: '0xec1d41dd553ce03c3e462aab8bcfba0e1726e6bf310db6e06a933bf0430419c0',
  })
  readonly blockHash: string;

  @ApiProperty({
    type: 'string',
    description:
      'The latest block number when this transaction was created. Used to control transaction lifetime (Alternative to block hash)',
    example: '0x00000000',
  })
  readonly blockNumber: string;

  @ApiProperty({
    type: 'string',
    description: 'How long this transaction is valid for',
    example: '0xc501',
  })
  readonly era: string;

  @ApiProperty({
    type: 'string',
    description: 'The chain this transaction is intended for',
    example: '0xfbd550612d800930567fda9db77af4591823bcee65812194c5eae52da2a1286a',
  })
  readonly genesisHash: string;

  @ApiProperty({
    type: 'string',
    description: 'The hex encoded transaction details',
    example: '0x1a075449434b455200000000000000ca9a3b00000000000000000000000000',
  })
  readonly method: string;

  @ApiProperty({
    type: 'string',
    description: 'The account nonce',
    example: '0x00000007',
  })
  readonly nonce: string;

  @ApiProperty({
    type: 'string',
    description: 'Signed extensions',
    isArray: true,
    example: [],
  })
  readonly signedExtensions: string[];

  @ApiProperty({
    type: 'string',
    example: '0x00000000000000000000000000000000',
    description: 'Additional fees paid (Should be 0 for Polymesh)',
  })
  tip: string;

  @ApiProperty({
    type: 'number',
    example: 4,
    description: 'The transaction version',
  })
  readonly version: number;

  constructor(model: PayloadModel) {
    Object.assign(this, model);
  }
}
