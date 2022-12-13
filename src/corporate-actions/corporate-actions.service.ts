import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CorporateActionDefaultConfig,
  DistributionWithDetails,
  DividendDistribution,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
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

  public async findDefaultConfigByTicker(ticker: string): Promise<CorporateActionDefaultConfig> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaultConfig();
  }

  public async updateDefaultConfigByTicker(
    ticker: string,
    corporateActionDefaultConfigDto: CorporateActionDefaultConfigDto
  ): ServiceReturn<void> {
    const { base, args } = extractTxBase(corporateActionDefaultConfigDto);
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionService.submit(
      asset.corporateActions.setDefaultConfig,
      args as Required<typeof args>,
      base
    );
  }

  public async findDistributionsByTicker(ticker: string): Promise<DistributionWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.distributions.get();
  }

  public async findDistribution(ticker: string, id: BigNumber): Promise<DistributionWithDetails> {
    const asset = await this.assetsService.findOne(ticker);

    return await asset.corporateActions.distributions.getOne({ id }).catch(handleSdkError);
  }

  public async createDividendDistribution(
    ticker: string,
    dividendDistributionDto: DividendDistributionDto
  ): ServiceReturn<DividendDistribution> {
    const {
      base,
      args: { originPortfolio, ...rest },
    } = extractTxBase(dividendDistributionDto);

    const asset = await this.assetsService.findOne(ticker);
    return this.transactionService.submit(
      asset.corporateActions.distributions.configureDividendDistribution,
      {
        ...rest,
        originPortfolio: toPortfolioId(originPortfolio),
      },
      base
    );
  }

  public async remove(
    ticker: string,
    corporateAction: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionService.submit(
      asset.corporateActions.remove,
      { corporateAction },
      transactionBaseDto
    );
  }

  public async payDividends(
    ticker: string,
    id: BigNumber,
    payDividendsDto: PayDividendsDto
  ): ServiceReturn<void> {
    const { base, args } = extractTxBase(payDividendsDto);
    const { distribution } = await this.findDistribution(ticker, id);

    return this.transactionService.submit(distribution.pay, args, base);
  }

  public async linkDocuments(
    ticker: string,
    id: BigNumber,
    linkDocumentsDto: LinkDocumentsDto
  ): ServiceReturn<void> {
    const {
      base,
      args: { documents },
    } = extractTxBase(linkDocumentsDto);

    const { distribution } = await this.findDistribution(ticker, id);

    const params = {
      documents: documents.map(document => document.toAssetDocument()),
    };
    return this.transactionService.submit(distribution.linkDocuments, params, base);
  }

  public async claimDividends(
    ticker: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { distribution } = await this.findDistribution(ticker, id);
    return this.transactionService.submit(distribution.claim, undefined, transactionBaseDto);
  }

  public async reclaimRemainingFunds(
    ticker: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { distribution } = await this.findDistribution(ticker, id);

    return this.transactionService.submit(distribution.reclaimFunds, undefined, transactionBaseDto);
  }

  public async modifyCheckpoint(
    ticker: string,
    id: BigNumber,
    modifyDistributionCheckpointDto: ModifyDistributionCheckpointDto
  ): ServiceReturn<void> {
    const { base, args } = extractTxBase(modifyDistributionCheckpointDto);

    const { distribution } = await this.findDistribution(ticker, id);

    return this.transactionService.submit(distribution.modifyCheckpoint, args, base);
  }
}
