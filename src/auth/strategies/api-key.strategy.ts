import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { AuthService } from '~/auth/auth.service';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';

export const apiKeyHeader = 'x-api-key';

// eslint-disable-next-line @typescript-eslint/ban-types
type Callback = (err: Error | null, user?: Object, info?: Object) => void;

/**
 * authenticate with an API key
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, AuthStrategy.apiKey) {
  constructor(private authService: AuthService) {
    super({ header: apiKeyHeader }, false, (apiKey: string, done: Callback) => {
      const user = this.authService.validateApiKey(apiKey);
      if (!user) {
        return done(new Error('api key not found'), undefined);
      }
      return done(null, user);
    });
  }
}
