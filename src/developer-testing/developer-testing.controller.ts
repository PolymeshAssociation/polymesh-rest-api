/* istanbul ignore file */

import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';

@Controller('developer-testing')
export class DeveloperTestingController {
  constructor(private readonly logger: PolymeshLogger) {}

  @ApiOperation({
    summary: 'Receives an arbitrary JSON payload and returns a 200 response',
    description:
      'This endpoint is meant to aid testing webhook functionality for developers. It has no use for a regular user of the API',
  })
  @Post('/webhook')
  async handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers(HANDSHAKE_HEADER_KEY) secret: string,
    @Res() res: Response
  ): Promise<void> {
    this.logger.debug(`Received webhook payload: ${JSON.stringify(payload)}`);

    if (secret) {
      res.header(HANDSHAKE_HEADER_KEY, secret);
    }
    res.status(200).send({});
  }
}
