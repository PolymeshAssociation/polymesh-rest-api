import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';

import { ClaimsService } from './claims.service';

@Module({
  imports: [PolymeshModule],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
