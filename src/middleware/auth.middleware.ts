import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import passport from 'passport';

import { parseAuthStrategyConfig } from '~/auth/auth.utils';
import { User } from '~/users/user.consts';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly strategies: string[];

  constructor(configService: ConfigService) {
    const rawAuth = configService.getOrThrow<string>('AUTH_STRATEGY');
    this.strategies = parseAuthStrategyConfig(rawAuth);
  }

  use(req: any, res: any, next: () => void) {
    passport.authenticate(this.strategies, { session: false }, (request, user: User, info) => {
      console.log('authenticated user: ', user);
      if (user) {
        next();
      } else {
        throw new UnauthorizedException('REST API user was not found');
      }
    })(req, res, next);
  }
}
