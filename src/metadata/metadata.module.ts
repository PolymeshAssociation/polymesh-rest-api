/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { MetadataController } from '~/metadata/metadata.controller';
import { MetadataService } from '~/metadata/metadata.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, forwardRef(() => AssetsModule)],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
