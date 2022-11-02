import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { parseApiKeysConfig } from '~/auth/auth.utils';
import { ApiKeyModel } from '~/auth/models/api-key.model';
import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { AppNotFoundError } from '~/common/errors';
import { generateBase64Secret } from '~/common/utils';
import { UserModel } from '~/users/model/user.model';
import { defaultUser } from '~/users/user.consts';

@Injectable()
export class LocalApiKeysRepo implements ApiKeyRepo {
  private apiKeys: Record<string, UserModel> = {};

  constructor(readonly config: ConfigService) {
    const givenApiKeys = config.getOrThrow<string>('API_KEYS');
    const apiKeys = parseApiKeysConfig(givenApiKeys);
    apiKeys.forEach(key => {
      this.apiKeys[key] = defaultUser;
    });
  }

  public async getUserByApiKey(apiKey: string): Promise<UserModel> {
    const user = this.apiKeys[apiKey];
    if (!user) {
      throw new AppNotFoundError('*REDACTED*', ApiKeyRepo.type);
    }

    return user;
  }

  public async deleteApiKey(apiKey: string): Promise<void> {
    delete this.apiKeys[apiKey];
  }

  public async createApiKey(user: UserModel): Promise<ApiKeyModel> {
    const secret = await generateBase64Secret(32);

    this.apiKeys[secret] = user;

    return { userId: user.id, secret };
  }
}
