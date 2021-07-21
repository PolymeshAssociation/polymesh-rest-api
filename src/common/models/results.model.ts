/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromMaybeEntityArray } from '~/common/decorators/transformation';

export class ResultsModel<DataType> {
  @ApiProperty({ type: 'generic array' })
  @FromMaybeEntityArray()
  readonly results: DataType[];

  constructor(model: ResultsModel<DataType>) {
    Object.assign(this, model);
  }
}
