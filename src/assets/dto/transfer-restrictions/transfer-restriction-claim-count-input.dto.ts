/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { TransferRestrictionClaimBaseInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-base-input.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class TransferRestrictionClaimCountInputDto extends TransferRestrictionClaimBaseInputDto {
  declare readonly type: TransferRestrictionType.ClaimCount;

  @ApiProperty({ description: 'Minimum claim count', example: '1', type: 'string' })
  @ToBigNumber()
  @IsBigNumber()
  readonly min: BigNumber;

  @ApiProperty({ description: 'Maximum claim count (optional)', example: '10', type: 'string' })
  @ToBigNumber()
  @IsBigNumber()
  readonly max?: BigNumber;

}
