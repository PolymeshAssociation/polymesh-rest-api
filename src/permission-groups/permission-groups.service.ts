import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AuthorizationRequest,
  CustomPermissionGroup,
  GroupPermissions,
  InviteExternalAgentParams,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { toPermissionGroupPermissions } from '~/assets/assets.util';
import { AppNotFoundError } from '~/common/errors';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { CreatePermissionGroupDto } from '~/permission-groups/dto/create-permission-group.dto';
import { GetPermissionGroupDto } from '~/permission-groups/dto/get-permission-group.dto';
import { InviteAgentToGroupDto } from '~/permission-groups/dto/invite-agent-to-group.dto';
import { RemoveAgentFromGroupDto } from '~/permission-groups/dto/remove-agent-from-grop.dto';
import { TransactionsService } from '~/transactions/transactions.service';

export type GroupWithPermissions = {
  id: BigNumber;
  permissions: GroupPermissions;
};

@Injectable()
export class PermissionGroupsService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
    private readonly identitiesService: IdentitiesService
  ) {}

  public async findOne(assetInput: string, id: BigNumber): Promise<CustomPermissionGroup> {
    const asset = await this.assetsService.findOne(assetInput);
    const group = await asset.permissions.getGroup({ id });
    const exists = await group.exists();

    if (!exists) {
      throw new AppNotFoundError(id.toString(), 'Custom permission group');
    }

    return group;
  }

  public async createPermissionGroup(
    assetId: string,
    params: CreatePermissionGroupDto
  ): ServiceReturn<CustomPermissionGroup> {
    const { options, args } = extractTxOptions(params);

    const {
      permissions: { createGroup },
    } = await this.assetsService.findOne(assetId);

    return this.transactionsService.submit(
      createGroup,
      { permissions: toPermissionGroupPermissions(args) },
      options
    );
  }

  public async getPermissionGroups(assetInput: string): Promise<BigNumber[]> {
    const asset = await this.assetsService.findOne(assetInput);

    const groups = await asset.permissions.getGroups();

    return groups.custom.map(group => group.id);
  }

  public async inviteAgentToGroup(
    assetInput: string,
    params: InviteAgentToGroupDto
  ): ServiceReturn<AuthorizationRequest> {
    const { options, args } = extractTxOptions(params);

    const [asset, target] = await Promise.all([
      this.assetsService.findOne(assetInput),
      this.identitiesService.findOne(params.target),
    ]);

    let permissions: InviteExternalAgentParams['permissions'];

    if (BigNumber.isBigNumber(args.permissions)) {
      permissions = await asset.permissions.getGroup({ id: args.permissions });
    } else if (typeof args.permissions === 'string') {
      permissions = await asset.permissions.getGroup({ type: args.permissions });
    } else {
      permissions = toPermissionGroupPermissions(args.permissions);
    }

    return this.transactionsService.submit(
      asset.permissions.inviteAgent,
      { target, permissions },
      options
    );
  }

  public async removeAgentFromAsset(
    assetInput: string,
    params: RemoveAgentFromGroupDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const [asset, target] = await Promise.all([
      this.assetsService.findOne(assetInput),
      this.identitiesService.findOne(args.target),
    ]);

    return this.transactionsService.submit(asset.permissions.removeAgent, { target }, options);
  }

  public async getGroupPermissions(params: GetPermissionGroupDto): Promise<GroupWithPermissions> {
    const { asset: assetInput, id } = params;

    const group = await this.findOne(assetInput, id);

    const permissions = await group.getPermissions();

    return { id, permissions };
  }

  public async modifyPermissions(
    assetInput: string,
    groupId: BigNumber,
    params: CreatePermissionGroupDto
  ): ServiceReturn<void> {
    const group = await this.findOne(assetInput, groupId);

    const { options, args } = extractTxOptions(params);

    return this.transactionsService.submit(
      group.setPermissions,
      { permissions: toPermissionGroupPermissions(args) },
      options
    );
  }
}
