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
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
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

  public async setDocuments(ticker: string, params: SetAssetDocumentsDto): ServiceReturn<Asset> {
    const {
      documents: { set },
    } = await this.findOne(ticker);
    const { signer, webhookUrl, documents } = params;
    return this.transactionsService.submit(set, { documents }, { signer, webhookUrl });
  }

  public async createAsset(params: CreateAssetDto): ServiceReturn<Asset> {
    const { signer, webhookUrl, ...rest } = params;

    const createAsset = this.polymeshService.polymeshApi.assets.createAsset;
    return this.transactionsService.submit(createAsset, rest, { signer, webhookUrl });
  }

  public async issue(ticker: string, params: IssueDto): ServiceReturn<Asset> {
    const { signer, webhookUrl, ...rest } = params;
    const asset = await this.findOne(ticker);

    return this.transactionsService.submit(asset.issuance.issue, rest, { signer, webhookUrl });
  }

  public async transferOwnership(
    ticker: string,
    params: TransferOwnershipDto
  ): ServiceReturn<AuthorizationRequest> {
    const { signer, webhookUrl, ...rest } = params;

    const { transferOwnership } = await this.findOne(ticker);
    return this.transactionsService.submit(transferOwnership, rest, { signer, webhookUrl });
  }

  public async redeem(ticker: string, params: RedeemTokensDto): ServiceReturn<void> {
    const { signer, webhookUrl, amount, from } = params;
    const { redeem } = await this.findOne(ticker);

    return this.transactionsService.submit(
      redeem,
      { amount, from: toPortfolioId(from) },
      { signer, webhookUrl }
    );
  }

  public async freeze(ticker: string, params: TransactionBaseDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.findOne(ticker);

    return this.transactionsService.submit(asset.freeze, {}, { signer, webhookUrl });
  }

  public async unfreeze(ticker: string, params: TransactionBaseDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.findOne(ticker);

    return this.transactionsService.submit(asset.unfreeze, {}, { signer, webhookUrl });
  }

  public async controllerTransfer(
    ticker: string,
    params: ControllerTransferDto
  ): ServiceReturn<void> {
    const { signer, webhookUrl, origin, amount } = params;

    const { controllerTransfer } = await this.findOne(ticker);

    return this.transactionsService.submit(
      controllerTransfer,
      { originPortfolio: origin.toPortfolioLike(), amount },
      { signer, webhookUrl }
    );
  }

  public async getOperationHistory(ticker: string): Promise<HistoricAgentOperation[]> {
    const asset = await this.findOne(ticker);
    return asset.getOperationHistory();
  }
}
