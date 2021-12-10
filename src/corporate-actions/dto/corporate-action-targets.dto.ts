/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class CorporateActionTargetsDto {
  @ApiProperty({
    description: 'Indicates how the `identities` are to be treated',
    type: 'string',
    enum: TargetTreatment,
    example: TargetTreatment.Include,
  })
  @IsEnum(TargetTreatment)
  readonly treatment: TargetTreatment;

  @ApiProperty({
    description:
      'Determines which Identities will be affected by the Corporate Action. If the value of `treatment` is `Include`, then all Identities in this array will be affected. Otherwise, every Asset holder Identity **EXCEPT** for the ones in this array will be affected',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  @IsDid({ each: true })
  readonly identities: string[];
}
