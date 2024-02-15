/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AffirmationStatus } from '@polymeshassociation/polymesh-sdk/types';

export class MediatorAffirmationModel {
  @ApiProperty({
    description: 'The status of the mediators affirmation',
    enum: AffirmationStatus,
    type: 'string',
  })
  readonly status: AffirmationStatus;

  @ApiPropertyOptional({
    description:
      'The expiry of the affirmation. The time should be checked to ensure the affirmation is still valid',
  })
  readonly expiry?: Date;

  constructor(model: MediatorAffirmationModel) {
    Object.assign(this, model);
  }
}
