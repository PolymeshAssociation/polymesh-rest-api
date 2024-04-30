import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AccountsService } from '~/accounts/accounts.service';
import { createPermissionsModel } from '~/accounts/accounts.util';
import { AccountParamsDto } from '~/accounts/dto/account-params.dto';
import { ModifyPermissionsDto } from '~/accounts/dto/modify-permissions.dto';
import { RevokePermissionsDto } from '~/accounts/dto/revoke-permissions.dto';
import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { AccountDetailsModel } from '~/accounts/models/account-details.model';
import { MultiSigDetailsModel } from '~/accounts/models/multi-sig-details.model';
import { PermissionsModel } from '~/accounts/models/permissions.model';
import { BalanceModel } from '~/assets/models/balance.model';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ExtrinsicModel } from '~/common/models/extrinsic.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { createIdentityModel, createSignerModel } from '~/identities/identities.util';
import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { NetworkService } from '~/network/network.service';
import { SubsidyModel } from '~/subsidy/models/subsidy.model';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { createSubsidyModel } from '~/subsidy/subsidy.util';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly networkService: NetworkService,
    private readonly subsidyService: SubsidyService
  ) {}

  @ApiOperation({
    summary: 'Get the DID associated with an Account',
    description: 'This endpoint provides account to identity lookup',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose DID is to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'DID of the Identity associated with the given Account',
    type: IdentitySignerModel,
  })
  @ApiNotFoundResponse({
    description: 'No DID is associated with the given account',
  })
  @Get(':account/identity')
  async getIdentity(@Param() { account }: AccountParamsDto): Promise<IdentitySignerModel> {
    const identity = await this.accountsService.getIdentity(account);

    if (!identity) {
      throw new NotFoundException('No DID is associated with the given account');
    }
    return new IdentitySignerModel({ did: identity.did });
  }

  @ApiOperation({
    summary: 'Get POLYX balance of an Account',
    description: 'This endpoint provides the free, locked and total POLYX balance of an Account',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose balance is to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Free, locked and total POLYX balance of the Account',
    type: BalanceModel,
  })
  @Get(':account/balance')
  async getAccountBalance(@Param() { account }: AccountParamsDto): Promise<BalanceModel> {
    const accountBalance = await this.accountsService.getAccountBalance(account);
    return new BalanceModel(accountBalance);
  }

  @ApiOperation({
    summary: 'Transfer an amount of POLYX to an account',
    description: 'This endpoint transfers an amount of POLYX to a specified Account',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      "<li>The destination Account doesn't have an associated Identity</li>" +
      '<li>The receiver Identity has an invalid CDD claim</li>' +
      '<li>Insufficient free balance</li>' +
      '</ul>',
  })
  @Post('transfer')
  async transferPolyx(@Body() params: TransferPolyxDto): Promise<TransactionResponseModel> {
    const result = await this.accountsService.transferPolyx(params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get transaction history of an Account',
    description:
      'This endpoint provides a list of transactions signed by the given Account. This requires Polymesh GraphQL Middleware Service',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose transaction history is to be fetched',
    type: 'string',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  @ApiArrayResponse(ExtrinsicModel, {
    description: 'List of transactions signed by the given Account',
    paginated: true,
  })
  @Get(':account/transactions')
  async getTransactionHistory(
    @Param() { account }: AccountParamsDto,
    @Query() filters: TransactionHistoryFiltersDto
  ): Promise<PaginatedResultsModel<ExtrinsicModel>> {
    const { data, count, next } = await this.accountsService.getTransactionHistory(
      account,
      filters
    );
    return new PaginatedResultsModel({
      results: data.map(extrinsic => new ExtrinsicModel(extrinsic)),
      total: count,
      next,
    });
  }

  @ApiOperation({
    summary: 'Get Account Permissions',
    description:
      'The endpoint retrieves the Permissions an Account has as a Permissioned Account for its corresponding Identity',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose Permissions are to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Permissions of the Account',
    type: PermissionsModel,
  })
  @ApiNotFoundResponse({
    description: 'Account is not associated with any Identity',
  })
  @Get(':account/permissions')
  async getPermissions(@Param() { account }: AccountParamsDto): Promise<PermissionsModel> {
    const permissions = await this.accountsService.getPermissions(account);
    return createPermissionsModel(permissions);
  }

  @ApiOperation({
    summary: 'Get Account Subsidy',
    description:
      'The endpoint retrieves the subsidized balance of this Account and the subsidizer Account',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose subsidy is to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Subsidy details for the Account',
    type: SubsidyModel,
  })
  @ApiNoContentResponse({
    description: 'Account is not being subsidized',
  })
  @Get(':account/subsidy')
  async getSubsidy(@Param() { account }: AccountParamsDto, @Res() res: Response): Promise<void> {
    const result = await this.subsidyService.getSubsidy(account);

    if (result) {
      res.status(HttpStatus.OK).json(createSubsidyModel(result));
    } else {
      res.status(HttpStatus.NO_CONTENT).send({});
    }
  }

  @ApiOperation({
    summary: 'Freeze secondary Accounts',
    description:
      'This endpoint freezes all the secondary Accounts in the signing Identity. This means revoking their permission to perform any operation on the chain and freezing their funds until the Accounts are unfrozen',
  })
  @ApiOkResponse({
    description: 'Secondary Accounts have been frozen',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The `signer` is not authorized to freeze their Identities secondary Accounts',
  })
  @ApiBadRequestResponse({
    description: 'The secondary Accounts are already frozen',
  })
  @Post('freeze')
  async freezeSecondaryAccounts(
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.accountsService.freezeSecondaryAccounts(transactionBaseDto);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Unfreeze secondary Accounts',
    description: 'This endpoint unfreezes all of the secondary Accounts in the signing Identity',
  })
  @ApiOkResponse({
    description: 'Secondary Accounts have been unfrozen',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The `signer` is not authorized to unfreeze their Identities secondary Accounts',
  })
  @ApiBadRequestResponse({
    description: 'The secondary Accounts are already unfrozen',
  })
  @Post('unfreeze')
  async unfreezeSecondaryAccounts(
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.accountsService.unfreezeSecondaryAccounts(transactionBaseDto);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Revoke all permissions for any secondary Account',
    description:
      'This endpoint revokes all permissions of a list of secondary Accounts associated with the signing Identity',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'One of the Accounts is not a secondary Account for the signing Identity',
  })
  @Post('permissions/revoke')
  async revokePermissions(@Body() params: RevokePermissionsDto): Promise<TransactionResponseModel> {
    const result = await this.accountsService.revokePermissions(params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Modify all permissions for any secondary Account',
    description:
      'This endpoint modifies all the permissions of a list of secondary Accounts associated with the signing Identity',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'One of the Accounts is not a secondary Account for the signing Identity',
  })
  @Post('permissions/modify')
  async modifyPermissions(@Body() params: ModifyPermissionsDto): Promise<TransactionResponseModel> {
    const result = await this.accountsService.modifyPermissions(params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: "Get chain's treasury Account",
    description:
      'This endpoint retrieves treasury Account details which holds the accumulated fees used for chain development and can only be accessed through governance',
  })
  @ApiOkResponse({
    description: 'Details about the treasury Account',
    type: AccountModel,
  })
  @Get('treasury')
  getTreasuryAccount(): AccountModel {
    const { address } = this.networkService.getTreasuryAccount();

    return new AccountModel({ address });
  }

  @ApiOperation({
    summary: 'Get Account details',
    description:
      'This endpoint retrieves the Account details for the given Account address. This includes the  associated Identity DID, primary account for that Identity and Secondary Accounts with the Permissions and the Subsidy details',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose details is to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Account details',
    type: AccountDetailsModel,
  })
  @ApiNotFoundResponse({
    description: 'No Account found for the given address',
  })
  @Get(':account')
  async getAccountDetails(@Param() { account }: AccountParamsDto): Promise<AccountDetailsModel> {
    const { identity, multiSigDetails } = await this.accountsService.getDetails(account);

    let identityModel;
    let multiSigDetailsModel;

    if (identity) {
      identityModel = await createIdentityModel(identity);
    }

    if (multiSigDetails) {
      multiSigDetailsModel = new MultiSigDetailsModel({
        signers: multiSigDetails.signers.map(createSignerModel),
        requiredSignatures: multiSigDetails.requiredSignatures,
      });
    }

    return new AccountDetailsModel({ identity: identityModel, multiSig: multiSigDetailsModel });
  }
}
