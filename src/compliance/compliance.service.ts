import { Injectable } from '@nestjs/common';
import {
  Asset,
  ComplianceRequirements,
  SetAssetRequirementsParams,
  TrustedClaimIssuer,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { processTransaction, TransactionResult } from '~/common/utils';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly signingService: SigningService
  ) {}

  public async findComplianceRequirements(ticker: string): Promise<ComplianceRequirements> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.compliance.requirements.get();
  }

  public async findTrustedClaimIssuers(ticker: string): Promise<TrustedClaimIssuer<true>[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.compliance.trustedClaimIssuers.get();
  }

  public async setRequirements(
    ticker: string,
    params: SetRequirementsDto
  ): Promise<TransactionResult<Asset>> {
    const { signer } = params;
    const asset = await this.assetsService.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      asset.compliance.requirements.set,
      params as SetAssetRequirementsParams,
      {
        signingAccount: address,
      }
    );
  }
}
