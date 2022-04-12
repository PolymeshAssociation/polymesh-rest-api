import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  Asset,
  AssetDocument,
  ErrorCode,
  IdentityBalance,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { SetAssetDocumentsDto } from '~/assets/dto/set-asset-documents.dto';
import { processQueue, QueueResult } from '~/common/utils';
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
  ): Promise<QueueResult<Asset>> {
    const {
      documents: { set },
    } = await this.findOne(ticker);

    const { signer, documents } = params;
    const address = await this.signingService.getAddressByHandle(signer);
    return processQueue(set, { documents }, { signingAccount: address });
  }

  public async createAsset(params: CreateAssetDto): Promise<QueueResult<Asset>> {
    const { signer, ...rest } = params;
    const signingAccount = await this.signingService.getAddressByHandle(signer);
    const createAsset = this.polymeshService.polymeshApi.assets.createAsset;
    return processQueue(createAsset, rest, { signingAccount });
  }

  public async issue(ticker: string, params: IssueDto): Promise<QueueResult<Asset>> {
    const { signer, ...rest } = params;
    const asset = await this.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processQueue(asset.issuance.issue, rest, { signingAccount: address });
  }
}
