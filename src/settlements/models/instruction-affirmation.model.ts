/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { AffirmationStatus, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';

export class InstructionAffirmationModel {
  @ApiProperty({
    description: 'The DID of the identity affirming the Instruction',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  identity: Identity;

  @ApiProperty({
    description: 'The current status of the Instruction',
    type: 'string',
    enum: AffirmationStatus,
    example: AffirmationStatus.Pending,
  })
  status: AffirmationStatus;

  constructor(model: InstructionAffirmationModel) {
    Object.assign(this, model);
  }
}
