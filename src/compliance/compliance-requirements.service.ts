import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddAssetRequirementParams,
  Asset,
  ComplianceRequirements,
  ModifyComplianceRequirementParams,
  SetAssetRequirementsParams,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
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

  public async setRequirements(ticker: string, params: SetRequirementsDto): ServiceReturn<Asset> {
    const { base, args } = extractTxBase(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.set,
      args as SetAssetRequirementsParams,
      base
    );
  }

  public async pauseRequirements(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionsService.submit(
      asset.compliance.requirements.pause,
      {},
      transactionBaseDto
    );
  }

  public async unpauseRequirements(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.unpause,
      {},
      transactionBaseDto
    );
  }

  public async deleteOne(
    ticker: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.remove,
      { requirement: id },
      transactionBaseDto
    );
  }

  public async deleteAll(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Asset> {
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.reset,
      undefined,
      transactionBaseDto
    );
  }

  public async add(ticker: string, params: RequirementDto): ServiceReturn<Asset> {
    const { base, args } = extractTxBase(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.add,
      args as AddAssetRequirementParams,
      base
    );
  }

  public async modify(ticker: string, id: BigNumber, params: RequirementDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.modify,
      { id, ...args } as ModifyComplianceRequirementParams,
      base
    );
  }

  public async arePaused(ticker: string): Promise<boolean> {
    const asset = await this.assetsService.findOne(ticker);

    return asset.compliance.requirements.arePaused();
  }
}
