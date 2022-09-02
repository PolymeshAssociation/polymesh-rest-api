import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
  AssetDocument,
  AuthorizationRequest,
  ErrorCode,
  HistoricAgentOperation,
  IdentityBalance,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { ControllerTransferDto } from '~/assets/dto/controller-transfer.dto';
import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { RedeemTokensDto } from '~/assets/dto/redeem-tokens.dto';
import { SetAssetDocumentsDto } from '~/assets/dto/set-asset-documents.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { processTransaction, TransactionResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly signingService: SigningService
  ) {}

  public async findOne(ticker: string): Promise<Asset> {
    try {
      return await this.polymeshService.polymeshApi.assets.getAsset({ ticker });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (
          code === ErrorCode.DataUnavailable &&
          message.startsWith('There is no Asset with ticker')
        ) {
          throw new NotFoundException(`There is no Asset with ticker "${ticker}"`);
        }
      }

      throw err;
    }
  }

  public async findAllByOwner(owner: string): Promise<Asset[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const isDidValid = await polymeshApi.identities.isIdentityValid({ identity: owner });

    if (!isDidValid) {
      throw new NotFoundException(`There is no identity with DID ${owner}`);
    }

    return polymeshApi.assets.getAssets({ owner });
  }

  public async findHolders(
    ticker: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const asset = await this.findOne(ticker);
    return asset.assetHolders.get({ size, start });
  }

  public async findDocuments(
    ticker: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<AssetDocument>> {
    const asset = await this.findOne(ticker);
    return asset.documents.get({ size, start });
  }

  public async setDocuments(
    ticker: string,
    params: SetAssetDocumentsDto
  ): Promise<TransactionResult<Asset>> {
    const {
      documents: { set },
    } = await this.findOne(ticker);

    const { signer, documents } = params;
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(set, { documents }, { signingAccount: address });
  }

  public async createAsset(params: CreateAssetDto): Promise<TransactionResult<Asset>> {
    const { signer, ...rest } = params;
    const signingAccount = await this.signingService.getAddressByHandle(signer);
    const createAsset = this.polymeshService.polymeshApi.assets.createAsset;
    return processTransaction(createAsset, rest, { signingAccount });
  }

  public async issue(ticker: string, params: IssueDto): Promise<TransactionResult<Asset>> {
    const { signer, ...rest } = params;
    const asset = await this.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(asset.issuance.issue, rest, { signingAccount: address });
  }

  public async transferOwnership(
    ticker: string,
    params: TransferOwnershipDto
  ): Promise<TransactionResult<AuthorizationRequest>> {
    const { signer, ...rest } = params;
    const address = await this.signingService.getAddressByHandle(signer);
    const { transferOwnership } = await this.findOne(ticker);
    return processTransaction(transferOwnership, rest, { signingAccount: address });
  }

  public async redeem(ticker: string, params: RedeemTokensDto): Promise<TransactionResult<void>> {
    const { signer, amount } = params;
    const { redeem } = await this.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(redeem, { amount }, { signingAccount: address });
  }

  public async freeze(ticker: string, params: SignerDto): Promise<TransactionResult<Asset>> {
    const { signer } = params;
    const asset = await this.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processTransaction(asset.freeze, { signingAccount: address }, {});
  }

  public async unfreeze(ticker: string, params: SignerDto): Promise<TransactionResult<Asset>> {
    const { signer } = params;
    const asset = await this.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processTransaction(asset.unfreeze, { signingAccount: address }, {});
  }

  public async controllerTransfer(
    ticker: string,
    params: ControllerTransferDto
  ): Promise<TransactionResult<void>> {
    const { signer, origin, amount } = params;

    const { controllerTransfer } = await this.findOne(ticker);

    const address = await this.signingService.getAddressByHandle(signer);

    return processTransaction(
      controllerTransfer,
      { originPortfolio: origin.toPortfolioLike(), amount },
      { signingAccount: address }
    );
  }

  public async getOperationHistory(ticker: string): Promise<HistoricAgentOperation[]> {
    const asset = await this.findOne(ticker);
    return asset.getOperationHistory();
  }
}
