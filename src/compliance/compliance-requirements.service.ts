import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddAssetRequirementParams,
  ComplianceRequirements,
  ModifyComplianceRequirementParams,
  SetAssetRequirementsParams,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
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

  public async setRequirements(ticker: string, params: SetRequirementsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.set,
      args as SetAssetRequirementsParams,
      options
    );
  }

  public async pauseRequirements(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionsService.submit(asset.compliance.requirements.pause, {}, options);
  }

  public async unpauseRequirements(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.requirements.unpause, {}, options);
  }

  public async deleteOne(
    ticker: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.remove,
      { requirement: id },
      options
    );
  }

  public async deleteAll(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.compliance.requirements.reset, undefined, options);
  }

  public async add(ticker: string, params: RequirementDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.add,
      args as AddAssetRequirementParams,
      options
    );
  }

  public async modify(ticker: string, id: BigNumber, params: RequirementDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(
      asset.compliance.requirements.modify,
      { id, ...args } as ModifyComplianceRequirementParams,
      options
    );
  }

  public async arePaused(ticker: string): Promise<boolean> {
    const asset = await this.assetsService.findOne(ticker);

    return asset.compliance.requirements.arePaused();
  }
}
