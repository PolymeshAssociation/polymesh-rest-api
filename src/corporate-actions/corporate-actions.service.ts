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
import { processTransaction, TransactionResult } from '~/common/utils';
import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { LinkDocumentsDto } from '~/corporate-actions/dto/link-documents.dto';
import { ModifyDistributionCheckpointDto } from '~/corporate-actions/dto/modify-distribution-checkpoint.dto';
import { PayDividendsDto } from '~/corporate-actions/dto/pay-dividends.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly signingService: SigningService
  ) {}

  public async findDefaultConfigByTicker(ticker: string): Promise<CorporateActionDefaultConfig> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaultConfig();
  }

  public async updateDefaultConfigByTicker(
    ticker: string,
    corporateActionDefaultConfigDto: CorporateActionDefaultConfigDto
  ): Promise<TransactionResult<void>> {
    const { signer, ...rest } = corporateActionDefaultConfigDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      asset.corporateActions.setDefaultConfig,
      rest as Required<typeof rest>,
      {
        signingAccount: address,
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
  ): Promise<TransactionResult<DividendDistribution>> {
    const { signer, originPortfolio, ...rest } = dividendDistributionDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      asset.corporateActions.distributions.configureDividendDistribution,
      {
        originPortfolio: toPortfolioId(originPortfolio),
        ...rest,
      },
      {
        signingAccount: address,
      }
    );
  }

  public async remove(
    ticker: string,
    corporateAction: BigNumber,
    signer: string
  ): Promise<TransactionResult<void>> {
    const asset = await this.assetsService.findOne(ticker);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      asset.corporateActions.remove,
      { corporateAction },
      {
        signingAccount: address,
      }
    );
  }

  public async payDividends(
    ticker: string,
    id: BigNumber,
    payDividendsDto: PayDividendsDto
  ): Promise<TransactionResult<void>> {
    const { signer, targets } = payDividendsDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      distribution.pay,
      { targets },
      {
        signingAccount: address,
      }
    );
  }

  public async linkDocuments(
    ticker: string,
    id: BigNumber,
    linkDocumentsDto: LinkDocumentsDto
  ): Promise<TransactionResult<void>> {
    const { signer, documents } = linkDocumentsDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = await this.signingService.getAddressByHandle(signer);
    const params = {
      documents: documents.map(document => document.toAssetDocument()),
    };
    return processTransaction(distribution.linkDocuments, params, {
      signingAccount: address,
    });
  }

  public async claimDividends(
    ticker: string,
    id: BigNumber,
    signer: string
  ): Promise<TransactionResult<void>> {
    const { distribution } = await this.findDistribution(ticker, id);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(distribution.claim, undefined, {
      signingAccount: address,
    });
  }

  public async reclaimRemainingFunds(
    ticker: string,
    id: BigNumber,
    signer: string
  ): Promise<TransactionResult<void>> {
    const { distribution } = await this.findDistribution(ticker, id);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(distribution.reclaimFunds, undefined, {
      signingAccount: address,
    });
  }

  public async modifyCheckpoint(
    ticker: string,
    id: BigNumber,
    modifyDistributionCheckpointDto: ModifyDistributionCheckpointDto
  ): Promise<TransactionResult<void>> {
    const { signer, checkpoint } = modifyDistributionCheckpointDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = await this.signingService.getAddressByHandle(signer);
    return processTransaction(
      distribution.modifyCheckpoint,
      { checkpoint },
      {
        signingAccount: address,
      }
    );
  }
}
