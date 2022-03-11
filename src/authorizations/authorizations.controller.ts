import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

@ApiTags('authorizations')
@Controller('authorizations')
export class AuthorizationsController {
  constructor(private readonly authorizationsService: AuthorizationsService) {}

  @ApiOperation({
    summary: 'Accept an Authorization Request',
    description:
      'This endpoint will accept a pending Authorization Request. You must be the target of the Request to be able to accept it',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Authorization Request to be accepted',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'There is no Authorization Request with the passed ID targeting the `signer`',
  })
  @Post('/:id/accept')
  public async accept(
    @Param() { id }: IdParamsDto,
    @Body() { signer }: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.authorizationsService.accept(id, signer);

    return new TransactionQueueModel({ transactions });
  }

  @ApiOperation({
    summary: 'Reject an Authorization Request',
    description:
      'This endpoint will reject a pending Authorization Request. You must be the target of the Request to be able to reject it',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Authorization Request to be accepted',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'There is no Authorization Request with the passed ID targeting the `signer`',
  })
  @Post('/:id/reject')
  public async reject(
    @Param() { id }: IdParamsDto,
    @Body() { signer }: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.authorizationsService.reject(id, signer);

    return new TransactionQueueModel({ transactions });
  }
}
