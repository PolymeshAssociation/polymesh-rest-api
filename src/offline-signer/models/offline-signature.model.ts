/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OfflineSignatureModel {
  @ApiProperty({
    description: 'The internal transaction ID',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The signature for the transaction',
  })
  @IsString()
  readonly signature: string;

  constructor(model: OfflineSignatureModel) {
    Object.assign(this, model);
  }
}
