import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiKeyModel } from '~/auth/models/api-key.model';
import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { AppNotFoundError } from '~/common/errors';
import { generateBase64Secret } from '~/common/utils';
import { ApiKey } from '~/datastore/postgres/entities/api-key.entity';
import { UserModel } from '~/users/model/user.model';

@Injectable()
export class PostgresApiKeyRepo implements ApiKeyRepo {
  constructor(@InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>) {}

  public async createApiKey(user: UserModel): Promise<ApiKeyModel> {
    const secret = await generateBase64Secret(32);
    const key = this.apiKeyRepo.create({ secret, user });
    await this.apiKeyRepo.save(key);

    return this.toApiKey(key);
  }

  public async getUserByApiKey(secret: string): Promise<UserModel> {
    const key = await this.apiKeyRepo.findOneBy({ secret });
    if (!key) {
      throw new AppNotFoundError('*REDACTED*', ApiKeyRepo.type);
    }
    return key.user;
  }

  public async deleteApiKey(apiKey: string): Promise<void> {
    await this.apiKeyRepo.delete({ secret: apiKey });
  }

  private toApiKey(apiKey: ApiKey): ApiKeyModel {
    const {
      secret,
      user: { id: userId },
    } = apiKey;

    return new ApiKeyModel({
      secret,
      userId,
    });
  }
}
