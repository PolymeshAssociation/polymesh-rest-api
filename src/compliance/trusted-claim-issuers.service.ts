import { Injectable } from '@nestjs/common';
import {
  Asset,
  ModifyAssetTrustedClaimIssuersAddSetParams,
  ModifyAssetTrustedClaimIssuersRemoveParams,
  TrustedClaimIssuer,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ServiceReturn } from '~/common/utils';
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
    const { signer, webhookUrl, ...rest } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.set,
      rest as ModifyAssetTrustedClaimIssuersAddSetParams,
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async add(ticker: string, params: SetTrustedClaimIssuersDto): ServiceReturn<Asset> {
    const { signer, webhookUrl, ...rest } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.add,
      rest as ModifyAssetTrustedClaimIssuersAddSetParams,
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async remove(ticker: string, params: RemoveTrustedClaimIssuersDto): ServiceReturn<Asset> {
    const { signer, webhookUrl, ...rest } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.trustedClaimIssuers.remove,
      rest as ModifyAssetTrustedClaimIssuersRemoveParams,
      {
        signer,
        webhookUrl,
      }
    );
  }
}
