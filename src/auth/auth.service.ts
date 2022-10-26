import { Injectable } from '@nestjs/common';

import { CreateApiKeyDto } from '~/auth/dto/create-api-key.dto';
import { DeleteApiKeyDto } from '~/auth/dto/delete-api-key.dto';
import { ApiKeyModel } from '~/auth/models/api-key.model';
import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { UserModel } from '~/users/model/user.model';
import { UsersService } from '~/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly apiKeyRepo: ApiKeyRepo
  ) {}

  public async createApiKey({ userName }: CreateApiKeyDto): Promise<ApiKeyModel> {
    const user = await this.userService.getByName(userName);

    return this.apiKeyRepo.createApiKey(user);
  }

  public async validateApiKey(apiKey: string): Promise<UserModel> {
    return this.apiKeyRepo.getUserByApiKey(apiKey);
  }

  public async deleteApiKey({ apiKey }: DeleteApiKeyDto): Promise<void> {
    return this.apiKeyRepo.deleteApiKey(apiKey);
  }
}
