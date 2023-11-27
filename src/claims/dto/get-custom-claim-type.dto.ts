import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';

export class GetCustomClaimTypeDto {
  @ApiProperty({
    description: 'The ID or Name of the CustomClaimType',
    example: '1',
  })
  @ToBigNumber()
  readonly identifier: BigNumber | string;
}
