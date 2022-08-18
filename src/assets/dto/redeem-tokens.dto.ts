/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class RedeemTokensDto extends SignerDto {
  @ApiProperty({
    description: 'The amount of Asset tokens to be redeemed',
    example: '100',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;
}
