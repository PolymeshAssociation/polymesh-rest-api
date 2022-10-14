import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { AuthService } from '~/auth/auth.service';
import { AuthStrategy } from '~/auth/strategies/strategies.conts';

export const apiKeyHeader = 'x-api-key';

/**
 * authenticate with an API key
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, AuthStrategy.apiKey) {
  constructor(private authService: AuthService) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({ header: apiKeyHeader }, false, (apiKey: string, done: any) => {
      const user = this.authService.validateApiKey(apiKey);
      if (!user) {
        return done(new Error('api key not found'), undefined);
      }
      return done(null, user);
    });
  }
}
