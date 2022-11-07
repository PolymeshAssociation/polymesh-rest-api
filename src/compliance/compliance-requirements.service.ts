import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddAssetRequirementParams,
  Asset,
  ComplianceRequirements,
  ModifyComplianceRequirementParams,
  SetAssetRequirementsParams,
  TrustedClaimIssuer,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ServiceReturn } from '~/common/utils';
import { RequirementDto } from '~/compliance/dto/requirement.dto';
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

  public async pauseRequirements(ticker: string, params: TransactionBaseDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionsService.submit(
      asset.compliance.requirements.pause,
      {},
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async unpauseRequirements(
    ticker: string,
    params: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.unpause,
      {},
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async deleteOne(
    ticker: string,
    id: BigNumber,
    params: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.remove,
      { requirement: id },
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async deleteAll(ticker: string, params: TransactionBaseDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.requirements.reset, undefined, {
      signer,
      webhookUrl,
    });
  }

  public async add(ticker: string, params: RequirementDto): ServiceReturn<Asset> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.add,
      params as AddAssetRequirementParams,
      {
        signer,
        webhookUrl,
      }
    );
  }

  public async modify(ticker: string, id: BigNumber, params: RequirementDto): ServiceReturn<void> {
    const { signer, webhookUrl } = params;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.modify,
      { id, ...params } as ModifyComplianceRequirementParams,
      {
        signer,
        webhookUrl,
      }
    );
  }
}
