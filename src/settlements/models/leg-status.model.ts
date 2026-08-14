/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { LegStatusType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class LegStatusModel {
  @ApiProperty({
    description: 'The status of the Instruction leg',
    type: 'string',
    enum: LegStatusType,
    example: LegStatusType.ExecutionPending,
  })
  readonly type: LegStatusType;

  @ApiPropertyOptional({
    description:
      'The Account that skipped executing this leg. Present when type is ExecutionToBeSkipped',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  readonly signer?: string;

  @ApiPropertyOptional({
    description:
      'Unique ID of the off-chain receipt that caused this leg to be skipped. Present when type is ExecutionToBeSkipped',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly uid?: BigNumber;

  constructor(model: LegStatusModel) {
    Object.assign(this, model);
  }
}
