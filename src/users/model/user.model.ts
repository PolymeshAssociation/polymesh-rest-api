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
    description:
      'The internal ID of the user. The exact format depends on the Datastore being used',
    example: 'ce97d1ec-2d77-463c-bbde-e077e055858c',
  })
  @FromBigNumber()
  readonly id: string;

  constructor(model: UserModel) {
    Object.assign(this, model);
  }
}
