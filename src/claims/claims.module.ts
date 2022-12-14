import { Module } from '@nestjs/common';

import { ClaimsController } from '~/claims/claims.controller';
import { ClaimsService } from '~/claims/claims.service';
import { LoggerModule } from '~/logger/logger.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  controllers: [ClaimsController],
  imports: [PolymeshModule, TransactionsModule, LoggerModule],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
