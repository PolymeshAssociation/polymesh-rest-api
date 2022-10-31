import { Injectable } from '@nestjs/common';
import { TrustedClaimIssuer } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';

@Injectable()
export class TrustedClaimIssuersService {
  constructor(private readonly assetsService: AssetsService) {}

  public async find(ticker: string): Promise<TrustedClaimIssuer<true>[]> {
    const asset = await this.assetsService.findOne(ticker);

    return asset.compliance.trustedClaimIssuers.get();
  }
}
