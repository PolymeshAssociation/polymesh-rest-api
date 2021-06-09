import { ApiProperty } from '@nestjs/swagger';

export class ResultsDto<DataType> {
  @ApiProperty({ type: 'generic array' })
  results: DataType[];
}
