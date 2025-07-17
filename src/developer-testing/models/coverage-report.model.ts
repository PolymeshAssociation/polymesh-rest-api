/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class CoverageReportModel {
  @ApiProperty({
    description: 'Percent of routes covered',
    type: 'string',
    example: '82',
  })
  @FromBigNumber()
  readonly coverage: BigNumber;

  @ApiProperty({
    description: 'Total number of routes enabled',
    type: 'string',
    example: '184',
  })
  @FromBigNumber()
  readonly total: BigNumber;

  @ApiProperty({
    description: 'Total number of routes not covered',
    type: 'string',
    example: '5',
  })
  @FromBigNumber()
  readonly totalUncovered: BigNumber;

  @ApiProperty({
    description: 'The paths that have not been executed since startup',
    type: 'string',
    isArray: true,
  })
  readonly uncoveredPaths: string[];

  constructor(model: CoverageReportModel) {
    Object.assign(this, model);
  }
}
