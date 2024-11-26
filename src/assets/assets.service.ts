import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
  AssetDocument,
  AuthorizationRequest,
  CustomPermissionGroup,
  FungibleAsset,
  GroupPermissions,
  HistoricAgentOperation,
  Identity,
  IdentityBalance,
  InviteExternalAgentParams,
  NftCollection,
  PermissionGroupType,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { toPermissionGroupPermissions } from '~/assets/assets.util';
import { ControllerTransferDto } from '~/assets/dto/controller-transfer.dto';
import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { CreatePermissionGroupDto } from '~/assets/dto/create-permission-group.dto';
import { InviteAgentToGroupDto } from '~/assets/dto/invite-agent-to-group.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { LinkTickerDto } from '~/assets/dto/link-ticker.dto';
import { RedeemTokensDto } from '~/assets/dto/redeem-tokens.dto';
import { RemoveAgentFromGroupDto } from '~/assets/dto/remove-agent-from-grop.dto';
import { RequiredMediatorsDto } from '~/assets/dto/required-mediators.dto';
import { SetAssetDocumentsDto } from '~/assets/dto/set-asset-documents.dto';
import { isAssetId } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { AppNotFoundError } from '~/common/errors';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class AssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findOne(asset: string): Promise<Asset> {
    let getAssetPromise;
    if (isAssetId(asset)) {
      getAssetPromise = this.polymeshService.polymeshApi.assets.getAsset({ assetId: asset });
    } else {
      getAssetPromise = this.polymeshService.polymeshApi.assets.getAsset({ ticker: asset });
    }
    return await getAssetPromise.catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findFungible(asset: string): Promise<FungibleAsset> {
    let getAssetPromise;
    if (isAssetId(asset)) {
      getAssetPromise = this.polymeshService.polymeshApi.assets.getFungibleAsset({
        assetId: asset,
      });
    } else {
      getAssetPromise = this.polymeshService.polymeshApi.assets.getFungibleAsset({ ticker: asset });
    }
    return await getAssetPromise.catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findAllByOwner(owner: string): Promise<(FungibleAsset | NftCollection)[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const isDidValid = await polymeshApi.identities.isIdentityValid({ identity: owner });

    if (!isDidValid) {
      throw new AppNotFoundError(owner, 'identity');
    }

    return polymeshApi.assets.getAssets({ owner });
  }

  public async findHolders(
    assetInput: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const asset = await this.findFungible(assetInput);
    return asset.assetHolders.get({ size, start });
  }

  public async findDocuments(
    assetInput: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<AssetDocument>> {
    const asset = await this.findOne(assetInput);
    return asset.documents.get({ size, start });
  }

  public async setDocuments(assetInput: string, params: SetAssetDocumentsDto): ServiceReturn<void> {
    const {
      documents: { set },
    } = await this.findOne(assetInput);
    const { options, args } = extractTxOptions(params);

    return this.transactionsService.submit(set, args, options);
  }

  public async createAsset(params: CreateAssetDto): ServiceReturn<FungibleAsset> {
    const { options, args } = extractTxOptions(params);

    const createAsset = this.polymeshService.polymeshApi.assets.createAsset;
    return this.transactionsService.submit(createAsset, args, options);
  }

  public async issue(assetInput: string, params: IssueDto): ServiceReturn<FungibleAsset> {
    const { options, args } = extractTxOptions(params);
    const asset = await this.findFungible(assetInput);

    return this.transactionsService.submit(asset.issuance.issue, args, options);
  }

  public async transferOwnership(
    assetInput: string,
    params: TransferOwnershipDto
  ): ServiceReturn<AuthorizationRequest> {
    const { options, args } = extractTxOptions(params);

    const { transferOwnership } = await this.findOne(assetInput);
    return this.transactionsService.submit(transferOwnership, args, options);
  }

  public async redeem(assetInput: string, params: RedeemTokensDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { redeem } = await this.findFungible(assetInput);

    return this.transactionsService.submit(
      redeem,
      { ...args, from: toPortfolioId(args.from) },
      options
    );
  }

  public async freeze(
    assetInput: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.findOne(assetInput);

    return this.transactionsService.submit(asset.freeze, {}, options);
  }

  public async unfreeze(
    assetInput: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.findOne(assetInput);

    return this.transactionsService.submit(asset.unfreeze, {}, options);
  }

  public async controllerTransfer(
    assetInput: string,
    params: ControllerTransferDto
  ): ServiceReturn<void> {
    const {
      options,
      args: { origin, amount },
    } = extractTxOptions(params);
    const { controllerTransfer } = await this.findFungible(assetInput);

    return this.transactionsService.submit(
      controllerTransfer,
      { originPortfolio: origin.toPortfolioLike(), amount },
      options
    );
  }

  public async getOperationHistory(assetInput: string): Promise<HistoricAgentOperation[]> {
    const asset = await this.findFungible(assetInput);
    return asset.getOperationHistory();
  }

  public async getRequiredMediators(assetInput: string): Promise<Identity[]> {
    const asset = await this.findOne(assetInput);
    return asset.getRequiredMediators().catch(error => {
      throw handleSdkError(error);
    });
  }

  public async addRequiredMediators(
    assetInput: string,
    params: RequiredMediatorsDto
  ): ServiceReturn<void> {
    const {
      options,
      args: { mediators },
    } = extractTxOptions(params);
    const { addRequiredMediators } = await this.findOne(assetInput);

    return this.transactionsService.submit(addRequiredMediators, { mediators }, options);
  }

  public async removeRequiredMediators(
    assetInput: string,
    params: RequiredMediatorsDto
  ): ServiceReturn<void> {
    const {
      options,
      args: { mediators },
    } = extractTxOptions(params);
    const { removeRequiredMediators } = await this.findOne(assetInput);

    return this.transactionsService.submit(removeRequiredMediators, { mediators }, options);
  }

  public async preApprove(assetInput: string, params: TransactionBaseDto): ServiceReturn<void> {
    const { options } = extractTxOptions(params);

    const {
      settlements: { preApprove },
    } = await this.findOne(assetInput);

    return this.transactionsService.submit(preApprove, {}, options);
  }

  public async removePreApproval(
    assetInput: string,
    params: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(params);

    const {
      settlements: { removePreApproval },
    } = await this.findOne(assetInput);

    return this.transactionsService.submit(removePreApproval, {}, options);
  }

  public async linkTickerToAsset(assetInput: string, params: LinkTickerDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { linkTicker } = await this.findOne(assetInput);
    return this.transactionsService.submit(linkTicker, args, options);
  }

  public async unlinkTickerFromAsset(
    assetInput: string,
    params: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(params);

    const { unlinkTicker } = await this.findOne(assetInput);
    return this.transactionsService.submit(unlinkTicker, {}, options);
  }

  public async createPermissionGroup(
    assetId: string,
    params: CreatePermissionGroupDto
  ): ServiceReturn<CustomPermissionGroup> {
    const { options, args } = extractTxOptions(params);

    const {
      permissions: { createGroup },
    } = await this.findOne(assetId);

    return this.transactionsService.submit(
      createGroup,
      { permissions: toPermissionGroupPermissions(args) },
      options
    );
  }

  public async getPermissionGroupsWithPermissions(
    assetInput: string
  ): Promise<
    Array<
      | { id: BigNumber; permissions: GroupPermissions }
      | { type: PermissionGroupType; permissions: GroupPermissions }
    >
  > {
    const asset = await this.findOne(assetInput);

    const groups = await asset.permissions.getGroups();

    const customPermissionPromises = groups.custom.map(group => group.getPermissions());
    const knownPermissionPromises = groups.known.map(group => group.getPermissions());

    const [customPermissions, knownPermissions] = await Promise.all([
      Promise.all(customPermissionPromises),
      Promise.all(knownPermissionPromises),
    ]);

    const customResults = groups.custom.map((group, index) => ({
      id: group.id,
      permissions: customPermissions[index],
    }));

    const knownResults = groups.known.map((group, index) => ({
      type: group.type,
      permissions: knownPermissions[index],
    }));

    return [...customResults, ...knownResults];
  }

  public async inviteAgentToGroup(
    assetInput: string,
    params: InviteAgentToGroupDto
  ): ServiceReturn<AuthorizationRequest> {
    const { options, args } = extractTxOptions(params);

    const asset = await this.findOne(assetInput);

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
      { target: args.target, permissions },
      options
    );
  }

  public async removeAgentFromAsset(
    assetInput: string,
    params: RemoveAgentFromGroupDto
  ): ServiceReturn<void> {
    const {
      options,
      args: { target },
    } = extractTxOptions(params);

    const asset = await this.findOne(assetInput);

    return this.transactionsService.submit(asset.permissions.removeAgent, { target }, options);
  }
}
