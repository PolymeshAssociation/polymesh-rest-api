/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { TokensModule } from '~/tokens/tokens.module';

import { IdentitiesController } from './identities.controller';
import { IdentitiesService } from './identities.service';

@Module({
  imports: [PolymeshModule, TokensModule, SettlementsModule],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
})
export class IdentitiesModule {}
