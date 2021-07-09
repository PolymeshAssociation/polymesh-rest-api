/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';

export class AuthorizationModel {
  @ApiProperty({
    type: 'string',
  })
  type: string;

  @ApiProperty()
  value: PortfolioModel | string | null;
}
