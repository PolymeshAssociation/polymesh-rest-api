import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { CreateTestAccountsDto } from '~/developer-testing/dto/create-test-accounts.dto';
import { CreateTestAdminsDto } from '~/developer-testing/dto/create-test-admins.dto';
import { createIdentityModel } from '~/identities/identities.util';
import { IdentityDetailsModel } from '~/identities/models/identity-details.model';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';

@ApiTags('developer-testing')
@Controller('developer-testing')
export class DeveloperTestingController {
  constructor(private readonly developerTestingService: DeveloperTestingService) {}

  @ApiOperation({
    summary: `Returns a 200 response and echos ${HANDSHAKE_HEADER_KEY} if present in the request`,
    description:
      'This endpoint is meant to aid testing webhook functionality for developers. It has no use for a regular user of the API (DEV ONLY)',
  })
  @ApiResponse({
    description:
      'An empty object will be returned. The handshake secret given will be set in the response headers',
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
      'Given a set of addresses this generates creates an Identity and transfers some POLYX to the address and makes them a CDD provider',
    description:
      'This endpoint initializes a set of addresses to be chain admin accounts. The signer must be a CDD provider and have sufficient POLYX to cover the initial amounts (DEV ONLY)',
  })
  @ApiArrayResponse(IdentityDetailsModel, {
    description: 'List of Identities that were made CDD providers and given POLYX',
    paginated: true,
  })
  @Post('/create-test-admins')
  async createTestAdmins(
    @Body() params: CreateTestAdminsDto
  ): Promise<ResultsModel<IdentityDetailsModel>> {
    const identities = await this.developerTestingService.createTestAdmins(params);
    const results = await Promise.all(identities.map(id => createIdentityModel(id)));

    return new ResultsModel({
      results,
    });
  }

  @ApiOperation({
    summary: 'Creates a set of CDD claims for each address given',
    description:
      'This endpoint creates Identities for multiple accounts. The signer must be a CDD provider and have sufficient POLYX to cover the initialPolyx amounts. (DEV ONLY)',
  })
  @ApiArrayResponse(IdentityDetailsModel, {
    description: 'List of Identities were created with a CDD claim by the signer',
    paginated: true,
  })
  @Post('/create-test-accounts')
  async createTestAccounts(
    @Body() params: CreateTestAccountsDto
  ): Promise<ResultsModel<IdentityDetailsModel>> {
    const ids = await this.developerTestingService.createTestAccounts(params);
    const results = await Promise.all(ids.map(id => createIdentityModel(id)));

    return new ResultsModel({ results });
  }
}
