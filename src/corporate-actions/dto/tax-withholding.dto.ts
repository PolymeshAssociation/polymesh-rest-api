/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber,IsDid } from '~/common/decorators/validation';

export class TaxWithholdingDto {
  @ApiProperty({
    description: 'DID for which the tax withholding percentage is to be overridden',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly identity: string;

  @ApiProperty({
    description: 'Tax withholding percentage (from 0 to 100)',
    type: 'string',
    example: '67.25',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly percentage: BigNumber;
}
