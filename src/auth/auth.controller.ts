import { Body, Controller, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { AuthService } from '~/auth/auth.service';
import { CreateApiKeyDto } from '~/auth/dto/create-api-key.dto';
import { RemoveApiKeyDto } from '~/auth/dto/delete-api-key.dto';
import { ApiKeyModel } from '~/auth/models/api-key.model';
import { apiKeyHeader } from '~/auth/strategies/api-key.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Create API Key',
    description: 'This endpoint will create an API Key',
  })
  @ApiOkResponse({
    description: `Details of the API key to be set for the request header: "${apiKeyHeader}"`,
    type: ApiKeyModel,
  })
  @Post('api-key/create')
  public async createApiKey(@Body() params: CreateApiKeyDto): Promise<ApiKeyModel> {
    return this.authService.createApiKey(params);
  }

  @ApiOperation({
    summary: 'Remove an API Key',
    description: 'This endpoint invalidates the given API key',
  })
  @ApiOkResponse({
    description: 'The API key was removed',
  })
  @ApiNotFoundResponse({
    description: 'The API key was not found',
  })
  @Post('/api-key/remove')
  public async deleteApiKey(@Body() { apiKey }: RemoveApiKeyDto): Promise<{ message: string }> {
    await this.authService.removeApiKey(apiKey);
    return { message: 'key removed' };
  }
}
