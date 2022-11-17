import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CorporateActionDefaultConfig,
  DistributionWithDetails,
  DividendDistribution,
  ErrorCode,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ServiceReturn } from '~/common/utils';
import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { LinkDocumentsDto } from '~/corporate-actions/dto/link-documents.dto';
import { ModifyDistributionCheckpointDto } from '~/corporate-actions/dto/modify-distribution-checkpoint.dto';
import { PayDividendsDto } from '~/corporate-actions/dto/pay-dividends.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';

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
    const { signer, webhookUrl, dryRun, ...rest } = corporateActionDefaultConfigDto;
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionService.submit(
      asset.corporateActions.setDefaultConfig,
      rest as Required<typeof rest>,
      {
        signer,
        webhookUrl,
        dryRun,
      }
    );
  }

  public async findDistributionsByTicker(ticker: string): Promise<DistributionWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.distributions.get();
  }

  public async findDistribution(ticker: string, id: BigNumber): Promise<DistributionWithDetails> {
    const asset = await this.assetsService.findOne(ticker);

    try {
      return await asset.corporateActions.distributions.getOne({ id });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          throw new NotFoundException(
            `The Dividend Distribution with id: "${id.toString()}" does not exist for ticker: "${ticker}"`
          );
        }
      }

      throw err;
    }
  }

  public async createDividendDistribution(
    ticker: string,
    dividendDistributionDto: DividendDistributionDto
  ): ServiceReturn<DividendDistribution> {
    const { signer, webhookUrl, dryRun, originPortfolio, ...rest } = dividendDistributionDto;
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionService.submit(
      asset.corporateActions.distributions.configureDividendDistribution,
      {
        originPortfolio: toPortfolioId(originPortfolio),
        ...rest,
      },
      {
        signer,
        webhookUrl,
        dryRun,
      }
    );
  }

  public async remove(
    ticker: string,
    corporateAction: BigNumber,
    signer: string,
    webhookUrl?: string,
    dryRun?: boolean
  ): ServiceReturn<void> {
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionService.submit(
      asset.corporateActions.remove,
      { corporateAction },
      {
        signer,
        webhookUrl,
        dryRun,
      }
    );
  }

  public async payDividends(
    ticker: string,
    id: BigNumber,
    payDividendsDto: PayDividendsDto
  ): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun, targets } = payDividendsDto;
    const { distribution } = await this.findDistribution(ticker, id);

    return this.transactionService.submit(
      distribution.pay,
      { targets },
      {
        signer,
        webhookUrl,
        dryRun,
      }
    );
  }

  public async linkDocuments(
    ticker: string,
    id: BigNumber,
    linkDocumentsDto: LinkDocumentsDto
  ): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun, documents } = linkDocumentsDto;
    const { distribution } = await this.findDistribution(ticker, id);

    const params = {
      documents: documents.map(document => document.toAssetDocument()),
    };
    return this.transactionService.submit(distribution.linkDocuments, params, {
      signer,
      webhookUrl,
      dryRun,
    });
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
    const { signer, webhookUrl, dryRun, checkpoint } = modifyDistributionCheckpointDto;
    const { distribution } = await this.findDistribution(ticker, id);

    return this.transactionService.submit(
      distribution.modifyCheckpoint,
      { checkpoint },
      {
        signer,
        webhookUrl,
        dryRun,
      }
    );
  }
}
