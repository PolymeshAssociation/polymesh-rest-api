/* istanbul ignore file */

import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

import { SignerDto } from '~/common/dto/signer.dto';
import { ToCaCheckpoint } from '~/corporate-actions/decorators/transformation';
import { IsCaCheckpoint } from '~/corporate-actions/decorators/validation';
import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';

export class ModifyDistributionCheckpointDto extends SignerDto {
  @ApiProperty({
    description:
      'Checkpoint to be updated. If a Schedule is passed, the next Checkpoint it creates will be used. If a Date is passed, a Checkpoint will be created at that date and used',
    oneOf: [
      { $ref: getSchemaPath(CorporateActionCheckpointDto) },
      { type: 'string', example: new Date('10/14/1987').toISOString() },
    ],
  })
  @IsCaCheckpoint()
  @ToCaCheckpoint()
  readonly checkpoint: Date | CorporateActionCheckpointDto;
}
