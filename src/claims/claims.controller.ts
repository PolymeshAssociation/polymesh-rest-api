import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ClaimsService } from '~/claims/claims.service';
import { AddInvestorUniquenessDto } from '~/claims/dto/add-investor-uniqueness.dto';
import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(
    private readonly claimsService: ClaimsService,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(ClaimsController.name);
  }

  @ApiOperation({
    summary: 'Add Claims targeting an Identity',
    description: 'This endpoint will add Claims to an Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
  })
  @Post('add')
  async addClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.addClaimsOnDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Edit Claims targeting an Identity',
    description: 'This endpoint will provide a list of all the Claims made about an Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
  })
  @Post('edit')
  async editClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.editClaimsOnDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Remove provided Claims from an Identity',
    description: 'This endpoint will remove Claims from an Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
  })
  @Post('remove')
  async revokeClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.revokeClaimsFromDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Add Investor uniqueness Claims to the signing Identity',
    description: 'This endpoint will add Investor uniqueness Claims to the signing Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
  })
  @Post('claims/remove')
  async addInvestorUniqueness(
    @Body() args: AddInvestorUniquenessDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.addInvestorUniqueness(args);

    return handleServiceResult(serviceResult);
  }
}
