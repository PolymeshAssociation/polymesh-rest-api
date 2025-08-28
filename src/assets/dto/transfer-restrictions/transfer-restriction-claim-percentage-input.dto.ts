/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { TransferRestrictionClaimBaseInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-base-input.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class TransferRestrictionClaimPercentageInputDto extends TransferRestrictionClaimBaseInputDto {
  declare readonly type: TransferRestrictionType.ClaimPercentage;

  @ApiProperty({ description: 'Minimum percentage', example: '1', type: 'string' })
  @ToBigNumber()
  @IsBigNumber({ min: 0, max: 100 })
  readonly min: BigNumber;

  @ApiProperty({ description: 'Maximum percentage', example: '10', type: 'string' })
  @ToBigNumber()
  @IsBigNumber({ min: 0, max: 100 })
  readonly max: BigNumber;

}
