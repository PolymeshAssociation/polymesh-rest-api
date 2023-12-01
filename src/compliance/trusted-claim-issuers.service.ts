import { Injectable } from '@nestjs/common';
import { TrustedClaimIssuer } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
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

  public async set(ticker: string, params: SetTrustedClaimIssuersDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.trustedClaimIssuers.set, args, options);
  }

  public async add(ticker: string, params: SetTrustedClaimIssuersDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.trustedClaimIssuers.add, args, options);
  }

  public async remove(ticker: string, params: RemoveTrustedClaimIssuersDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.remove,
      args,
      options
    );
  }
}
