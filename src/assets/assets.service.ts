import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSecurityTokenParams } from '@polymathnetwork/polymesh-sdk/internal';
import {
  DefaultTrustedClaimIssuer,
  IdentityBalance,
  isPolymeshError,
  Requirement,
  ResultSet,
  SecurityToken,
  TickerReservation,
  TokenDocument,
} from '@polymathnetwork/polymesh-sdk/types';

import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { ReserveTickerDto as RegisterTickerDto } from '~/assets/dto/reserve-ticker.dto';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findOne(ticker: string): Promise<SecurityToken> {
    try {
      const asset = await this.polymeshService.polymeshApi.getSecurityToken({ ticker });

      return asset;
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;
        if (message.startsWith('There is no Security Token with ticker')) {
          throw new NotFoundException(`There is no Asset with ticker "${ticker}"`);
        }
      }

      throw err;
    }
  }

  public async findAllByOwner(owner: string): Promise<SecurityToken[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const isDidValid = await polymeshApi.isIdentityValid({ identity: owner });

    if (!isDidValid) {
      throw new NotFoundException(`There is no identity with DID ${owner}`);
    }

    return polymeshApi.getSecurityTokens({ owner });
  }

  public async findHolders(
    ticker: string,
    size: number,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const asset = await this.findOne(ticker);
    return asset.tokenHolders.get({ size, start });
  }

  public async findDocuments(
    ticker: string,
    size: number,
    start?: string
  ): Promise<ResultSet<TokenDocument>> {
    const asset = await this.findOne(ticker);
    return asset.documents.get({ size, start });
  }

  public async findComplianceRequirements(ticker: string): Promise<Requirement[]> {
    const asset = await this.findOne(ticker);
    return asset.compliance.requirements.get();
  }

  public async findTrustedClaimIssuers(ticker: string): Promise<DefaultTrustedClaimIssuer[]> {
    const asset = await this.findOne(ticker);
    return asset.compliance.trustedClaimIssuers.get();
  }

  public async registerTicker(params: RegisterTickerDto): Promise<QueueResult<TickerReservation>> {
    const { signer, ...rest } = params;
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(this.polymeshService.polymeshApi.reserveTicker, rest, { signer: address });
  }

  public async createAsset(params: CreateAssetDto): Promise<QueueResult<SecurityToken>> {
    const { signer, ...rest } = params;
    let reservation: TickerReservation;
    let reserveResponse: QueueResult<TickerReservation> | undefined;
    // if the asset isn't already reserved we will attempt to reserve it for the user
    try {
      reservation = await this.findTickerReservation(params.ticker);
    } catch (err) {
      if (err instanceof NotFoundException) {
        reserveResponse = await this.registerTicker({ signer, ticker: params.ticker });
        reservation = reserveResponse.result;
      } else {
        throw err;
      }
    }
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const args: CreateSecurityTokenParams = {
      name: rest.name,
      totalSupply: rest.totalSupply,
      isDivisible: rest.isDivisible,
      tokenType: rest.assetType,
      tokenIdentifiers: rest.identifiers,
      fundingRound: rest.fundingRound,
      documents: rest.documents,
    };
    const res = await processQueue(reservation.createToken, args, { signer: address });
    // prepend the reserve transaction if nessesary
    if (reserveResponse) {
      return {
        ...res,
        transactions: [...reserveResponse.transactions, ...res.transactions],
      };
    }
    return res;
  }

  public async findTickerReservation(ticker: string): Promise<TickerReservation> {
    try {
      const reservation = await this.polymeshService.polymeshApi.getTickerReservation({ ticker });
      return reservation;
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;
        if (message.startsWith('There is no reservation for')) {
          throw new NotFoundException(`There is no reservation for "${ticker}"`);
        } else if (message.endsWith('token has been created')) {
          throw new GoneException(`${ticker} has already been created`);
        }
      }

      throw err;
    }
  }
}
