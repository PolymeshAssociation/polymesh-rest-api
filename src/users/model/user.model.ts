/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromBigNumber } from '~/common/decorators/transformation';

export class UserModel {
  @ApiProperty({
    type: 'string',
    description: 'Name of the user',
    example: 'Alice',
  })
  readonly name: string;

  @ApiProperty({
    type: 'string',
    description: 'The internal ID of the user',
    example: '1',
  })
  @FromBigNumber()
  readonly id: string;

  constructor(model: UserModel) {
    Object.assign(this, model);
  }
}
