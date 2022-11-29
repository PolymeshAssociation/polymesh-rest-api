import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { authorizationRequestResolver } from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { AccountModel } from '~/identities/models/account.model';
import { CreateSubsidyDto } from '~/subsidy/dto/create-subsidy.dto';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { SubsidyParamsDto } from '~/subsidy/dto/subsidy-params.dto';
import { SubsidyModel } from '~/subsidy/models/subsidy.model';
import { SubsidyService } from '~/subsidy/subsidy.service';

@Controller('accounts/subsidy')
export class SubsidyController {
  constructor(private readonly subsidyService: SubsidyService) {}

  @ApiOperation({
    summary: 'Get Account Subsidy',
    description:
      'The endpoint retrieves the subsidized balance of this Account and the subsidizer Account',
  })
  @ApiParam({
    name: 'subsidizer',
    description: 'The Account address of the subsidizer',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiParam({
    name: 'subsidizer',
    description: 'The Account address of the beneficiary',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Subsidy details for the Account',
    type: SubsidyModel,
  })
  @ApiNotFoundResponse({
    description: 'The Subsidy no longer exists',
  })
  @Get(':subsidizer/:beneficiary')
  async getSubsidy(@Param() { beneficiary, subsidizer }: SubsidyParamsDto): Promise<SubsidyModel> {
    const allowance = await this.subsidyService.getAllowance(beneficiary, subsidizer);

    return new SubsidyModel({
      beneficiary: new AccountModel({ address: beneficiary }),
      subsidizer: new AccountModel({ address: subsidizer }),
      allowance,
    });
  }

  @ApiOperation({
    summary: 'Subsidize an account',
    description:
      'This endpoint sends an Authorization Request to an Account to subsidize its transaction fees',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'The Beneficiary Account already has a pending invitation to add this account as a subsidizer with the same allowance',
    ],
  })
  @Post('create')
  async subsidizeAccount(@Body() params: CreateSubsidyDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.subsidyService.subsidizeAccount(params);

    return handleServiceResult(serviceResult, authorizationRequestResolver);
  }

  @ApiOperation({
    summary: 'Modify allowance for a Subsidy relationship an account',
    description:
      'This endpoint allows to set/increase/decrease allowance of a Subsidy relationship. Note that only the subsidizer is allowed to modify the allowance',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'The Beneficiary Account already has a pending invitation to add this account as a subsidizer with the same allowance',
    ],
  })
  @Post('allowance/modify')
  async modifyAllowance(@Body() params: ModifyAllowanceDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.subsidyService.modifyAllowance(params);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Quit a Subsidy relationship',
    description:
      'This endpoint terminates a Subsidy relationship. The beneficiary Account will be forced to pay for their own transactions',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Subsidy no longer exists'],
  })
  @Post('quit')
  async quitSubsidy(@Body() params: QuitSubsidyDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.subsidyService.quit(params);
    return handleServiceResult(serviceResult);
  }
}
