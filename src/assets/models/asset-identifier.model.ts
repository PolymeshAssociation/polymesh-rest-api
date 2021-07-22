import { ApiProperty } from '@nestjs/swagger';
import { TokenIdentifierType } from '@polymathnetwork/polymesh-sdk/types';

export class AssetIdentifierModel {
  @ApiProperty({
    description: 'Identifier type of the Asset',
    type: 'string',
    enum: TokenIdentifierType,
    example: TokenIdentifierType.Isin,
  })
  readonly type: TokenIdentifierType;

  @ApiProperty({
    description: 'The identifier value for the Asset',
    type: 'string',
    example: 'US0000000000',
  })
  readonly value: string;

  constructor(model: AssetIdentifierModel) {
    Object.assign(this, model);
  }
}
