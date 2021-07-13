import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';

import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

@Module({
  imports: [PolymeshModule],
  providers: [ClaimsService],
  controllers: [ClaimsController],
})
export class ClaimsModule {}
