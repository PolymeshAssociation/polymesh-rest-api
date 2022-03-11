import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CorporateActionDefaultConfig,
  DistributionWithDetails,
  DividendDistribution,
  ErrorCode,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { processQueue, QueueResult } from '~/common/utils';
import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { LinkDocumentsDto } from '~/corporate-actions/dto/link-documents.dto';
import { ModifyDistributionCheckpointDto } from '~/corporate-actions/dto/modify-distribution-checkpoint.dto';
import { PayDividendsDto } from '~/corporate-actions/dto/pay-dividends.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findDefaultConfigByTicker(ticker: string): Promise<CorporateActionDefaultConfig> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaultConfig();
  }

  public async updateDefaultConfigByTicker(
    ticker: string,
    corporateActionDefaultConfigDto: CorporateActionDefaultConfigDto
  ): Promise<QueueResult<void>> {
    const { signer, ...rest } = corporateActionDefaultConfigDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.corporateActions.setDefaultConfig, rest as Required<typeof rest>, {
      signer: address,
    });
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
  ): Promise<QueueResult<DividendDistribution>> {
    const { signer, originPortfolio, ...rest } = dividendDistributionDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(
      asset.corporateActions.distributions.configureDividendDistribution,
      {
        originPortfolio: toPortfolioId(originPortfolio),
        ...rest,
      },
      {
        signer: address,
      }
    );
  }

  public async remove(
    ticker: string,
    corporateAction: BigNumber,
    signer: string
  ): Promise<QueueResult<void>> {
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(
      asset.corporateActions.remove,
      { corporateAction },
      {
        signer: address,
      }
    );
  }

  public async payDividends(
    ticker: string,
    id: BigNumber,
    payDividendsDto: PayDividendsDto
  ): Promise<QueueResult<void>> {
    const { signer, targets } = payDividendsDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(
      distribution.pay,
      { targets },
      {
        signer: address,
      }
    );
  }

  public async linkDocuments(
    ticker: string,
    id: BigNumber,
    linkDocumentsDto: LinkDocumentsDto
  ): Promise<QueueResult<void>> {
    const { signer, documents } = linkDocumentsDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const params = {
      documents: documents.map(document => document.toAssetDocument()),
    };
    return processQueue(distribution.linkDocuments, params, {
      signer: address,
    });
  }

  public async claimDividends(
    ticker: string,
    id: BigNumber,
    signer: string
  ): Promise<QueueResult<void>> {
    const { distribution } = await this.findDistribution(ticker, id);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(distribution.claim, undefined, {
      signer: address,
    });
  }

  public async reclaimRemainingFunds(
    ticker: string,
    id: BigNumber,
    signer: string
  ): Promise<QueueResult<void>> {
    const { distribution } = await this.findDistribution(ticker, id);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(distribution.reclaimFunds, undefined, {
      signer: address,
    });
  }

  public async modifyCheckpoint(
    ticker: string,
    id: BigNumber,
    modifyDistributionCheckpointDto: ModifyDistributionCheckpointDto
  ): Promise<QueueResult<void>> {
    const { signer, checkpoint } = modifyDistributionCheckpointDto;
    const { distribution } = await this.findDistribution(ticker, id);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(
      distribution.modifyCheckpoint,
      { checkpoint },
      {
        signer: address,
      }
    );
  }
}
