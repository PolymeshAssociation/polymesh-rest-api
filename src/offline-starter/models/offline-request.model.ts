/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { IsString } from 'class-validator';

export class OfflineRequestModel {
  @ApiProperty({
    description: 'The internal ID',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The transaction payload to be signed',
  })
  payload: TransactionPayload;

  constructor(model: OfflineRequestModel) {
    Object.assign(this, model);
  }
}
