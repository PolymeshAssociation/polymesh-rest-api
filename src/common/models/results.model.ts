/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromEntityObject } from '~/common/decorators/transformation';

export class ResultsModel<DataType> {
  @ApiProperty({ type: 'array' })
  @FromEntityObject()
  readonly results: DataType[];

  constructor(model: ResultsModel<DataType>) {
    Object.assign(this, model);
  }
}
