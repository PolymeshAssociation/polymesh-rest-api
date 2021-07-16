/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromMaybeEntityArray } from '~/common/decorators/transformation';

export class ResultsDto<DataType> {
  @ApiProperty({ type: 'generic array' })
  @FromMaybeEntityArray()
  readonly results: DataType[];

  constructor(dto: ResultsDto<DataType>) {
    Object.assign(this, dto);
  }
}
