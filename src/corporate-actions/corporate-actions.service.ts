import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CorporateActionDefaultConfig,
  DistributionWithDetails,
  DividendDistribution,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { LinkDocumentsDto } from '~/corporate-actions/dto/link-documents.dto';
import { ModifyDistributionCheckpointDto } from '~/corporate-actions/dto/modify-distribution-checkpoint.dto';
import { PayDividendsDto } from '~/corporate-actions/dto/pay-dividends.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly transactionService: TransactionsService
  ) {}

  public async findDefaultConfigByAsset(asset: string): Promise<CorporateActionDefaultConfig> {
    const fungibleAsset = await this.assetsService.findFungible(asset);
    return fungibleAsset.corporateActions.getDefaultConfig();
  }

  public async updateDefaultConfigByAsset(
    asset: string,
    corporateActionDefaultConfigDto: CorporateActionDefaultConfigDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(corporateActionDefaultConfigDto);
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return this.transactionService.submit(
      fungibleAsset.corporateActions.setDefaultConfig,
      args as Required<typeof args>,
      options
    );
  }

  public async findDistributionsByAsset(asset: string): Promise<DistributionWithDetails[]> {
    const fungibleAsset = await this.assetsService.findFungible(asset);
    return fungibleAsset.corporateActions.distributions.get();
  }

  public async findDistribution(asset: string, id: BigNumber): Promise<DistributionWithDetails> {
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return await fungibleAsset.corporateActions.distributions.getOne({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async createDividendDistribution(
    asset: string,
    dividendDistributionDto: DividendDistributionDto
  ): ServiceReturn<DividendDistribution> {
    const {
      options,
      args: { originPortfolio, ...rest },
    } = extractTxOptions(dividendDistributionDto);

    const fungibleAsset = await this.assetsService.findFungible(asset);
    return this.transactionService.submit(
      fungibleAsset.corporateActions.distributions.configureDividendDistribution,
      {
        ...rest,
        originPortfolio: toPortfolioId(originPortfolio),
      },
      options
    );
  }

  public async remove(
    asset: string,
    corporateAction: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const fungibleAsset = await this.assetsService.findFungible(asset);
    return this.transactionService.submit(
      fungibleAsset.corporateActions.remove,
      { corporateAction },
      options
    );
  }

  public async payDividends(
    asset: string,
    id: BigNumber,
    payDividendsDto: PayDividendsDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(payDividendsDto);
    const { distribution } = await this.findDistribution(asset, id);

    return this.transactionService.submit(distribution.pay, args, options);
  }

  public async linkDocuments(
    asset: string,
    id: BigNumber,
    linkDocumentsDto: LinkDocumentsDto
  ): ServiceReturn<void> {
    const {
      options,
      args: { documents },
    } = extractTxOptions(linkDocumentsDto);

    const { distribution } = await this.findDistribution(asset, id);

    const params = {
      documents: documents.map(document => document.toAssetDocument()),
    };
    return this.transactionService.submit(distribution.linkDocuments, params, options);
  }

  public async claimDividends(
    asset: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const { distribution } = await this.findDistribution(asset, id);
    return this.transactionService.submit(distribution.claim, undefined, options);
  }

  public async reclaimRemainingFunds(
    asset: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const { distribution } = await this.findDistribution(asset, id);

    return this.transactionService.submit(distribution.reclaimFunds, undefined, options);
  }

  public async modifyCheckpoint(
    asset: string,
    id: BigNumber,
    modifyDistributionCheckpointDto: ModifyDistributionCheckpointDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(modifyDistributionCheckpointDto);

    const { distribution } = await this.findDistribution(asset, id);

    return this.transactionService.submit(distribution.modifyCheckpoint, args, options);
  }
}
