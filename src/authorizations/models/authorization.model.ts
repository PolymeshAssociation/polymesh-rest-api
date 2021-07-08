import { ApiProperty } from '@nestjs/swagger';

/* istanbul ignore file */
import { PortfolioModel } from '~/portfolios/models/portfolio.model';

export class AuthorizationModel {
  @ApiProperty({
    type: 'string',
  })
  type: string;

  @ApiProperty()
  value: PortfolioModel | string | null;
}
