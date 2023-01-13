import { ApiProperty } from '@nestjs/swagger';
import { ScopeType } from '@polymeshassociation/polymesh-sdk/types';

export class ScopeModel {
  @ApiProperty({
    description: 'Status of the ticker Reservation',
    type: 'string',
    enum: ScopeType,
    example: ScopeType.Identity,
  })
  readonly type: ScopeType;

  @ApiProperty({
    type: 'string',
    description: 'Value of the scope',
    example: '0x6'.padEnd(66, '1a'),
  })
  readonly value: string;

  constructor(model: ScopeModel) {
    Object.assign(this, model);
  }
}
