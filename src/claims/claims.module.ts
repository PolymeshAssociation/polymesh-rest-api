import { Module } from '@nestjs/common';

import { ClaimsService } from '~/claims/claims.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [PolymeshModule],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
