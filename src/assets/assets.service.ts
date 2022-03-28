import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  Asset,
  AssetDocument,
  ErrorCode,
  IdentityBalance,
  ResultSet,
  TickerReservation,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { ReserveTickerDto as RegisterTickerDto } from '~/assets/dto/reserve-ticker.dto';
import { processQueue, QueueResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SignerService } from '~/signer/signer.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly signerService: SignerService
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

  public async registerTicker(params: RegisterTickerDto): Promise<QueueResult<TickerReservation>> {
    const { signer, ...rest } = params;
    const address = await this.signerService.getAddressByHandle(signer);
    const reserveTicker = this.polymeshService.polymeshApi.assets.reserveTicker;
    return processQueue(reserveTicker, rest, { signingAccount: address });
  }

  public async createAsset(params: CreateAssetDto): Promise<QueueResult<Asset>> {
    const { signer, ...rest } = params;
    const signingAccount = await this.signerService.getAddressByHandle(signer);
    const createAsset = this.polymeshService.polymeshApi.assets.createAsset;
    return processQueue(createAsset, rest, { signingAccount });
  }

  public async issue(ticker: string, params: IssueDto): Promise<QueueResult<Asset>> {
    const { signer, ...rest } = params;
    const asset = await this.findOne(ticker);
    const address = await this.signerService.getAddressByHandle(signer);
    return processQueue(asset.issuance.issue, rest, { signingAccount: address });
  }

  public async findTickerReservation(ticker: string): Promise<TickerReservation> {
    try {
      return await this.polymeshService.polymeshApi.assets.getTickerReservation({
        ticker,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (
          code === ErrorCode.UnmetPrerequisite &&
          message.startsWith('There is no reservation for')
        ) {
          throw new NotFoundException(`There is no reservation for "${ticker}"`);
        } else if (
          code === ErrorCode.UnmetPrerequisite &&
          message.endsWith('Asset has been created')
        ) {
          throw new GoneException(`Asset ${ticker} has already been created`);
        }
      }

      throw err;
    }
  }
}
