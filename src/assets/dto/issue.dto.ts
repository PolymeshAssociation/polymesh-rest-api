/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class IssueDto extends SignerDto {
  @ApiProperty({
    description: 'The amount of the Asset to issue',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsNumber()
  readonly amount: BigNumber;
}
