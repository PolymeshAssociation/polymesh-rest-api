/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { ResultsModel } from '~/common/models/results.model';

export class PaginatedResultsModel<DataType> extends ResultsModel<DataType> {
  @ApiProperty({
    type: 'string',
    description: 'Total number of results possible for paginated output',
    example: '10',
  })
  @FromBigNumber()
  readonly total?: BigNumber;

  @ApiProperty({
    type: 'string',
    description:
      'Offset start value for the next set of paginated data (null means there is no more data to fetch)',
    nullable: true,
  })
  @FromBigNumber()
  readonly next: string | BigNumber | null;

  constructor(model: PaginatedResultsModel<DataType>) {
    const { results, ...rest } = model;
    super({ results });

    Object.assign(this, rest);
  }
}
