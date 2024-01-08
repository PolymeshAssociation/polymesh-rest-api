/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
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

  @ApiProperty({
    description: 'The payload for the transaction',
  })
  @ApiProperty({
    description: 'The transaction payload for which the signature is for',
  })
  payload: TransactionPayload;

  constructor(model: OfflineSignatureModel) {
    Object.assign(this, model);
  }
}
