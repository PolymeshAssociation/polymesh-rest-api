import { Module } from '@nestjs/common';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { IdentitiesService } from './identities.service';
import { IdentitiesController } from './identities.controller';
import { TokensModule } from '~/tokens/tokens.module';

@Module({
  imports: [PolymeshModule, TokensModule],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
})
export class IdentitiesModule {}
