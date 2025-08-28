/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { TransferRestrictionBaseDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-base.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class TransferRestrictionCountInputDto extends TransferRestrictionBaseDto {
  declare readonly type: TransferRestrictionType.Count;

  @ApiProperty({
    description:
      'Limit on the amount of different (unique) investors that can hold the Asset at once',
    example: '100',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly count: BigNumber;
}
