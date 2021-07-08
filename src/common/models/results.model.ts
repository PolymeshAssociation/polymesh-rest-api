/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class ResultsModel<DataType> {
  @ApiProperty({ type: 'generic array' })
  readonly results: DataType[];
}
