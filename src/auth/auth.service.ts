import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { parseApiKeysConfig } from '~/auth/auth.utils';
import { CreateApiKeyDto } from '~/auth/dto/create-api-key.dto';
import { DeleteApiKeyDto } from '~/auth/dto/delete-api-key.dto';
import { ApiKeyModel } from '~/auth/models/api-key.model';
import { generateBase64Secret } from '~/common/utils';
import { User, UserId } from '~/users/user.consts';

@Injectable()
export class AuthService {
  private userStore: Record<UserId, User> = {};

  constructor(config: ConfigService) {
    const givenApiKeys = config.getOrThrow<string>('API_KEYS');
    const apiKeys = parseApiKeysConfig(givenApiKeys);

    const configuredUserId = 'configured-user';
    this.userStore[configuredUserId] = { id: configuredUserId, apiKeys };
  }

  public async createApiKey({ userId }: CreateApiKeyDto): Promise<ApiKeyModel> {
    const secret = await generateBase64Secret(32);

    if (!this.userStore[userId]) {
      this.userStore[userId] = { id: userId, apiKeys: [] };
    }
    this.userStore[userId].apiKeys.push(secret);

    return { userId, secret };
  }

  /**
   * Returns the associated user by an API key
   */
  public validateApiKey(apiKey: string): User | undefined {
    return this.getUserByApiKey(apiKey);
  }

  /**
   * @param apiKey - key to delete
   */
  public async deleteApiKey({ apiKey }: DeleteApiKeyDto): Promise<void> {
    const user = this.getUserByApiKey(apiKey);
    if (user) {
      user.apiKeys = user.apiKeys.filter(key => key !== apiKey);
    }
  }

  /**
   * @note, will likely need to be a abstracted with a "repository" type interface when a data store is added
   */
  private getUserByApiKey(apiKey: string): User | undefined {
    return Object.values(this.userStore).find(({ apiKeys }) => apiKeys.includes(apiKey));
  }
}
