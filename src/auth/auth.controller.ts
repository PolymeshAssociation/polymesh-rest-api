import { Body, Controller, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '~/auth/auth.service';
import { CreateApiKeyDto } from '~/auth/dto/create-api-key.dto';
import { DeleteApiKeyDto } from '~/auth/dto/delete-api-key.dto';
import { ApiKeyModel } from '~/auth/models/api-key.model';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Create API Key',
    description: 'This endpoint will create an API Key',
  })
  @ApiOkResponse({
    description: 'Details of the API key created',
    type: ApiKeyModel,
  })
  @Post('api-key/create')
  public async createApiKey(@Body() params: CreateApiKeyDto): Promise<ApiKeyModel> {
    return this.authService.createApiKey(params);
  }

  @ApiOperation({
    summary: 'Delete an API Key',
    description: 'This endpoint invalidates the given API key',
  })
  @ApiNoContentResponse({
    description: 'The API key is no longer valid',
  })
  @Post('/api-key/delete')
  public async deleteApiKey(@Body() params: DeleteApiKeyDto): Promise<void> {
    await this.authService.deleteApiKey(params);
  }
}
