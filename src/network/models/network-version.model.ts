/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';

export class NetworkVersionModel {
  @ApiProperty({
    description: 'Chain version',
    type: 'string',
    example: '6.1.0',
  })
  readonly version: string;

  constructor(model: NetworkVersionModel) {
    Object.assign(this, model);
  }
}
