/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class IdParamsDto {
  @IsBigNumber()
  @ToBigNumber()
  @ApiProperty({
    description: 'The ID of the entity',
    type: 'string',
    example: '1',
  })
  readonly id: BigNumber;
}
