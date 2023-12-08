/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class RawPayloadModel {
  @ApiProperty({
    type: 'string',
    description: 'The signing address',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  readonly address: string;

  @ApiProperty({
    type: 'string',
    description: 'The raw transaction hex encoded',
    example:
      '0x1a075449434b455200000000000000ca9a3b00000000000000000000000000c5011c00848d5b0004000000fbd550612d800930567fda9db77af4591823bcee65812194c5eae52da2a1286aec1d41dd553ce03c3e462aab8bcfba0e1726e6bf310db6e06a933bf0430419c0',
  })
  readonly data: string;

  @ApiProperty({
    type: 'string',
    description: 'The type of `data`',
    example: 'payload',
  })
  readonly type: 'payload' | 'bytes';

  constructor(model: RawPayloadModel) {
    Object.assign(this, model);
  }
}
