/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject } from 'class-validator';

import { PayloadModel } from '~/common/models/payload.model';
import { RawPayloadModel } from '~/common/models/raw-payload.model';
import { PayloadDto } from '~/transactions/dto/payload.dto';

export class TransactionPayloadModel {
  @ApiProperty({
    type: 'string',
    description: 'The method of the transaction',
    example: '0x80041a075449434b455200000000000000ca9a3b00000000000000000000000000',
  })
  readonly method: string;

  @ApiProperty({
    type: PayloadDto,
    description: 'The transaction payload',
  })
  @Type(() => PayloadModel)
  readonly payload: PayloadModel;

  @ApiProperty({
    type: RawPayloadModel,
    description: 'The raw transaction payload',
  })
  @Type(() => RawPayloadModel)
  readonly rawPayload: RawPayloadModel;

  @ApiProperty({
    description: 'Additional information associated with the transaction',
    example: '{ clientId: "123" }',
  })
  @IsObject()
  readonly metadata: Record<string, string>;

  constructor(model: TransactionPayloadModel) {
    Object.assign(this, model);
  }
}
