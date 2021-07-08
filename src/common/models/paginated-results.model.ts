/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { number } from 'joi';

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
    example:
      '0x450a315c6beccd937c81a1e00c1dde371f9a5cdaa69ae18b303cc78055e0896e8cbc7caa57761df6c8bc8f9c408eb557a83ad41622f8ffb5722b2298b642530f049f20b5e84f76790407a7764dd414487690e018f80e3c34e108000000000000',
  })
  readonly next: string;
}
