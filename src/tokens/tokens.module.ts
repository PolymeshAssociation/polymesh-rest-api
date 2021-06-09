import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';

import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

@Module({
  imports: [PolymeshModule],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
