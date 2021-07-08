/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PortfoliosService } from '~/portfolios/portfolios.service';

@Module({
  imports: [],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
  controllers: [],
})
export class PortfoliosModule {}
