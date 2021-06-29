/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { TokensModule } from '~/tokens/tokens.module';

import { IdentitiesController } from './identities.controller';
import { IdentitiesService } from './identities.service';

@Module({
  imports: [PolymeshModule, TokensModule, forwardRef(() => SettlementsModule)],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
