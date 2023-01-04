/* istanbul ignore file */

import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { CreateCddProviders } from '~/developer-testing/dto/create-admin.dto';
import { CreateMockIdentityBatchDto } from '~/developer-testing/dto/create-mock-identity-batch';
import { createIdentityModel } from '~/identities/identities.util';
import { IdentityModel } from '~/identities/models/identity.model';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';

@ApiTags('developer-testing')
@Controller('developer-testing')
export class DeveloperTestingController {
  constructor(private readonly developerTestingService: DeveloperTestingService) {}

  @ApiOperation({
    summary: `Returns a 200 response and echos ${HANDSHAKE_HEADER_KEY} if present in the request`,
    description:
      'This endpoint is meant to aid testing webhook functionality for developers. It has no use for a regular user of the API',
  })
  @Post('/webhook')
  async handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers(HANDSHAKE_HEADER_KEY) secret: string,
    @Res() res: Response
  ): Promise<void> {
    if (secret) {
      res.header(HANDSHAKE_HEADER_KEY, secret);
    }
    res.status(200).send({});
  }

  @ApiOperation({
    summary:
      'Given a set of addresses this generates CDD claims, provides with a large amount of POLYX and makes them CDD providers',
    description:
      'This endpoint initializes a set of addresses to be chain admin accounts. The signer must best a CDD provider and have sufficient POLYX to cover the initial amounts (DEV ONLY)',
  })
  @Post('/create-admins')
  async createAdmins(@Body() params: CreateCddProviders): Promise<IdentityModel[]> {
    const ids = await this.developerTestingService.batchCreateAdmins(params);

    return Promise.all(ids.map(id => createIdentityModel(id)));
  }

  @ApiOperation({
    summary: 'Creates a set of CDD claims for each address given',
    description:
      'This endpoint creates Identities for multiple accounts. Intended for testing purposes only',
  })
  @Post('/create-identity-batch')
  async createIdentityBatch(@Body() params: CreateMockIdentityBatchDto): Promise<IdentityModel[]> {
    const ids = await this.developerTestingService.batchCddClaimsWithSigner(params);

    return Promise.all(ids.map(id => createIdentityModel(id)));
  }
}
