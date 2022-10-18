import { Injectable } from '@nestjs/common';
import {
  Asset,
  ComplianceRequirements,
  SetAssetRequirementsParams,
  TrustedClaimIssuer,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ServiceReturn } from '~/common/utils';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class ComplianceRequirementsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findComplianceRequirements(ticker: string): Promise<ComplianceRequirements> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.compliance.requirements.get();
  }

  public async findTrustedClaimIssuers(ticker: string): Promise<TrustedClaimIssuer<true>[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.compliance.trustedClaimIssuers.get();
  }

  public async setRequirements(ticker: string, params: SetRequirementsDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionsService.submit(
      asset.compliance.requirements.set,
      params as SetAssetRequirementsParams,
      {
        signer,
        webhookUrl,
      }
    );
  }
}
