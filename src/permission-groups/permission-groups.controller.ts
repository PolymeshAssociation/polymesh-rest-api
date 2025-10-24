import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { CustomPermissionGroup } from '@polymeshassociation/polymesh-sdk/types';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { CreatedCustomPermissionGroupModel } from '~/assets/models/created-custom-permission-group.model';
import { authorizationRequestResolver } from '~/authorizations/authorizations.util';
import {
  ApiArrayResponse,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { AbdicateAgentDto } from '~/permission-groups/dto/abdicate-agent.dto';
import { AssignAgentToGroupDto } from '~/permission-groups/dto/assign-agent-to-group.dto';
import { CheckPermissionsDto } from '~/permission-groups/dto/check-permissions.dto';
import { CreatePermissionGroupDto } from '~/permission-groups/dto/create-permission-group.dto';
import { GetPermissionGroupDto } from '~/permission-groups/dto/get-permission-group.dto';
import { InviteAgentToGroupDto } from '~/permission-groups/dto/invite-agent-to-group.dto';
import { RemoveAgentFromGroupDto } from '~/permission-groups/dto/remove-agent-from-grop.dto';
import { CheckPermissionsResultModel } from '~/permission-groups/models/check-permissions-result.model';
import { PermissionGroupWithPermissionsModel } from '~/permission-groups/models/permission-group-with-permissions.model';
import { PermissionGroupsService } from '~/permission-groups/permission-groups.service';

@Controller('assets/:asset/permission-groups')
@ApiTags('permission-groups', 'assets')
export class PermissionGroupsController {
  constructor(private readonly permissionGroupsService: PermissionGroupsService) {}

  @ApiOperation({
    summary: 'Create a permission group',
    description: 'This endpoint allows for the creation of a permission group for an asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: ['There already exists a group with the exact same permissions'],
    [HttpStatus.UNAUTHORIZED]: [
      'The signing identity does not have the required permissions to create a permission group',
    ],
  })
  @Post('create')
  public async createGroup(
    @Param() { asset }: AssetParamsDto,
    @Body() params: CreatePermissionGroupDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.createPermissionGroup(asset, params);

    const resolver: TransactionResolver<CustomPermissionGroup> = ({
      result: group,
      transactions,
      details,
    }) =>
      new CreatedCustomPermissionGroupModel({
        id: group.id,
        transactions,
        details,
      });

    return handleServiceResult(result, resolver);
  }

  @ApiOperation({
    summary: 'Get Permission Groups with their permissions',
    description: 'This endpoint allows fetching all Permission Groups with their permissions',
  })
  @ApiArrayResponse(PermissionGroupWithPermissionsModel, {
    description: 'List of Permission Groups with their permissions',
    paginated: false,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @Get('')
  public async getPermissionGroupsWithPermissions(
    @Param() { asset }: AssetParamsDto
  ): Promise<ResultsModel<BigNumber>> {
    const results = await this.permissionGroupsService.getPermissionGroups(asset);

    return new ResultsModel({
      results,
    });
  }

  @ApiOperation({
    summary: 'Invite external agent',
    description: 'This endpoint invites an external agent to an Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'The target Identity is already an External Agent',
      'The passed DID does not correspond to an on-chain user Identity. It may correspond to an Asset Identity',
    ],
    [HttpStatus.UNAUTHORIZED]: [
      'The signing identity does not have the required permissions to invite an external agent',
    ],
    [HttpStatus.NOT_FOUND]: [
      'The Permission Group does not exist',
      'The Identity does not exist',
      'The Asset does not exist',
    ],
  })
  @Post('invite-agent')
  public async inviteAgent(
    @Param() { asset }: AssetParamsDto,
    @Body() params: InviteAgentToGroupDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.inviteAgentToGroup(asset, params);

    return handleServiceResult(result, authorizationRequestResolver);
  }

  @ApiOperation({
    summary: 'Assign external agent to a different permission group',
    description:
      'This endpoint moves an existing external agent to another permission group for the same Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'The Agent is already part of this permission group',
      'The target must already be an Agent for the Asset',
      'The target is the last Agent with full permissions for this Asset. There should always be at least one Agent with full permissions',
    ],
    [HttpStatus.UNAUTHORIZED]: [
      "The signing identity does not have the required permissions to change an agent's permission group",
    ],
    [HttpStatus.NOT_FOUND]: [
      'The Permission Group does not exist',
      'The Identity does not exist',
      'The Asset does not exist',
    ],
  })
  @Post('assign-agent')
  public async assignAgentToGroup(
    @Param() { asset }: AssetParamsDto,
    @Body() params: AssignAgentToGroupDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.assignAgentToGroup(asset, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Remove external agent',
    description: 'This endpoint removes an external agent from an Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'The target is the last Agent with full permissions for this Asset. There should always be at least one Agent with full permissions',
      'The target Identity is not an External Agent',
      'The passed DID does not correspond to an on-chain user Identity. It may correspond to an Asset Identity',
    ],
    [HttpStatus.UNAUTHORIZED]: [
      'The signing identity does not have the required permissions to remove an agent from a permission group',
    ],
    [HttpStatus.NOT_FOUND]: ['The Identity does not exist', 'The Asset does not exist'],
  })
  @Post('remove-agent')
  public async removeAgent(
    @Param() { asset }: AssetParamsDto,
    @Body() params: RemoveAgentFromGroupDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.removeAgentFromAsset(asset, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Abdicate external agent permissions',
    description: 'This endpoint allows an Identity to abdicate its permissions for an Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: ['The Identity is not currently an agent for the supplied Asset'],
    [HttpStatus.UNAUTHORIZED]: [
      'The signing identity does not have the required permissions to abdicate',
    ],
    [HttpStatus.NOT_FOUND]: ['The Identity does not exist', 'The Asset does not exist'],
  })
  @Post('abdicate')
  public async abdicateAgent(
    @Param() { asset }: AssetParamsDto,
    @Body() body: AbdicateAgentDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.abdicateAgent(asset, body);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get custom permission group permissions',
    description: 'This endpoint allows fetching the permissions of a custom permission group',
  })
  @ApiOkResponse({
    description: 'The permissions of the custom permission group',
    type: PermissionGroupWithPermissionsModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiNotFoundResponse({
    description: 'The custom permission group does not exist',
  })
  @Get(':id')
  public async getGroupPermissions(
    @Param() params: GetPermissionGroupDto
  ): Promise<PermissionGroupWithPermissionsModel> {
    const result = await this.permissionGroupsService.getGroupPermissions(params);

    return new PermissionGroupWithPermissionsModel(result);
  }

  @ApiOperation({
    summary: 'Modify custom permission group permissions',
    description: 'This endpoint allows modifying the permissions of a custom permission group',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: ['New permissions are the same as the current ones'],
    [HttpStatus.UNAUTHORIZED]: [
      'The signing identity does not have the required permissions to set group permissions',
    ],
    [HttpStatus.NOT_FOUND]: [
      'The Identity does not exist',
      'The Asset does not exist',
      'The Permission Group does not exist',
    ],
  })
  @Post(':id/set')
  public async setPermissions(
    @Param() { asset, id }: GetPermissionGroupDto,
    @Body() body: CreatePermissionGroupDto
  ): Promise<TransactionResponseModel> {
    const result = await this.permissionGroupsService.modifyPermissions(asset, id, body);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get custom permission group permissions',
    description: 'This endpoint allows fetching the permissions of a custom permission group',
  })
  @ApiOkResponse({
    description: 'The result of the permission check',
    type: CheckPermissionsResultModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiNotFoundResponse({
    description: 'The Identity does not exist',
  })
  @Get('check-permissions')
  public async checkPermissions(
    @Param() { asset }: AssetParamsDto,
    @Query() query: CheckPermissionsDto
  ): Promise<CheckPermissionsResultModel> {
    const result = await this.permissionGroupsService.checkPermissions(asset, query);

    return new CheckPermissionsResultModel(result);
  }
}
