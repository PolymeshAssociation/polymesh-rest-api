import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DefaultTrustedClaimIssuer,
  IdentityBalance,
  isPolymeshError,
  Requirement,
  ResultSet,
  SecurityToken,
  TokenDocument,
} from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class AssetsService {
  constructor(private readonly polymeshService: PolymeshService) {}

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
}
