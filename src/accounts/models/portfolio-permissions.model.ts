/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PermissionTypeModel } from '~/accounts/models/permission-type.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';

export class PortfolioPermissionsModel extends PermissionTypeModel {
  @ApiProperty({
    description: 'List of Portfolios to be included or excluded',
    isArray: true,
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly values: PortfolioIdentifierModel[];

  constructor(model: PortfolioPermissionsModel) {
    const { type, ...rest } = model;
    super({ type });

    Object.assign(this, rest);
  }
}
