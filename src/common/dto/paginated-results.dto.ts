/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { ResultsDto } from '~/common/dto/results.dto';

export class PaginatedResultsDto<DataType> extends ResultsDto<DataType> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  start: string;
}
