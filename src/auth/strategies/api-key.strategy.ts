import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { AuthService } from '~/auth/auth.service';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';
import { AppUnauthorizedError } from '~/common/errors';
import { UserModel } from '~/users/model/user.model';

export const apiKeyHeader = 'x-api-key';

/**
 * authenticate with an API key
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, AuthStrategy.ApiKey) {
  constructor(private readonly authService: AuthService) {
    super({ header: apiKeyHeader, prefix: '' }, false);
  }

  public async validate(apiKey: string): Promise<UserModel> {
    const user = await this.authService.validateApiKey(apiKey);

    if (!user) {
      throw new AppUnauthorizedError('API key not found');
    }

    return user;
  }
}
