/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { TransferRestrictionBaseDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-base.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class TransferRestrictionPercentageInputDto extends TransferRestrictionBaseDto {
  declare readonly type: TransferRestrictionType.Percentage;

  @ApiProperty({
    description:
      'Maximum percentage (0-100) of the total supply of the Asset that can be held by a single investor at once',
    example: '50',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber({ min: 0, max: 100 })
  readonly percentage: BigNumber;
}
