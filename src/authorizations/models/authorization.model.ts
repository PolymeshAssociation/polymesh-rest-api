/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';

import { PortfolioModel } from '~/portfolios/models/portfolio.model';

import { PermissionsModel } from './../../identities/models/secondary-key.model';

export class AuthorizationModel {
  @ApiProperty({
    type: 'string',
  })
  type: string;

  @ApiProperty()
  value: PortfolioModel | string | PermissionsModel | null;
}
