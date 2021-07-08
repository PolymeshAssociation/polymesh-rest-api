/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { ResultsDto } from '~/common/dto/results.dto';

export class PaginatedResultsDto<DataType> extends ResultsDto<DataType> {
  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly size: number;

  @ApiProperty()
  readonly start: string;
}
