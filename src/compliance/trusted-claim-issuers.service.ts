import { Injectable } from '@nestjs/common';
import {
  Asset,
  ModifyAssetTrustedClaimIssuersAddSetParams,
  ModifyAssetTrustedClaimIssuersRemoveParams,
  TrustedClaimIssuer,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ServiceReturn } from '~/common/utils';
import { RemoveTrustedClaimIssuers } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuers } from '~/compliance/dto/set-trusted-claim-issuers.dto';
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

  public async set(ticker: string, params: SetTrustedClaimIssuers): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.set,
      params as ModifyAssetTrustedClaimIssuersAddSetParams,
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async add(ticker: string, params: SetTrustedClaimIssuers): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.add,
      params as ModifyAssetTrustedClaimIssuersAddSetParams,
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async remove(ticker: string, params: RemoveTrustedClaimIssuers): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.remove,
      params as ModifyAssetTrustedClaimIssuersRemoveParams,
      {
        signer,
        webhookUrl,
      }
    );
  }
}
