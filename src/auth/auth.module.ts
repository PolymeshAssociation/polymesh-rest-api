import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { OpenStrategy } from '~/auth/strategies/open.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [AuthService, ApiKeyStrategy, OpenStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
