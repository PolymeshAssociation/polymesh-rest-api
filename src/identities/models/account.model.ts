/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class AccountModel {
  @ApiProperty({
    type: 'string',
  })
  key?: string;

  @ApiProperty({
    type: 'string',
  })
  address?: string;

  constructor(model?: AccountModel) {
    Object.assign(this.address, model);
  }
}
