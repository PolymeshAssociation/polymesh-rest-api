import { Injectable } from '@nestjs/common';
import { Asset, TrustedClaimIssuer } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { RemoveTrustedClaimIssuersDto } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuersDto } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class TrustedClaimIssuersService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async find(ticker: string): Promise<TrustedClaimIssuer<true>[]> {
    const asset = await this.assetsService.findOne(ticker);

    return asset.compliance.trustedClaimIssuers.get();
  }

  public async set(ticker: string, params: SetTrustedClaimIssuersDto): ServiceReturn<Asset> {
    const { base, args } = extractTxBase(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.trustedClaimIssuers.set, args, base);
  }

  public async add(ticker: string, params: SetTrustedClaimIssuersDto): ServiceReturn<Asset> {
    const { base, args } = extractTxBase(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.trustedClaimIssuers.add, args, base);
  }

  public async remove(ticker: string, params: RemoveTrustedClaimIssuersDto): ServiceReturn<Asset> {
    const { base, args } = extractTxBase(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.trustedClaimIssuers.remove, args, base);
  }
}
