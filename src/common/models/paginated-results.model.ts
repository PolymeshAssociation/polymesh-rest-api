/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { ResultsModel } from '~/common/models/results.model';

export class PaginatedResultsModel<DataType> extends ResultsModel<DataType> {
  @ApiProperty({
    type: 'number',
    description: 'Total number of results possible for paginated output',
    example: 10,
  })
  readonly total: number;

  @ApiProperty({
    type: 'string',
    description: 'Offset start value for the next set of paginated data',
  })
  readonly next: string | number;
}
