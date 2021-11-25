import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CorporateActionDefaults,
  DistributionWithDetails,
  ErrorCode,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { CorporateActionDefaultsDto } from '~/corporate-actions/dto/corporate-action-defaults.dto';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findDefaultsByTicker(ticker: string): Promise<CorporateActionDefaults> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaults();
  }

  public async updateDefaultsByTicker(
    ticker: string,
    corporateActionDefaultsDto: CorporateActionDefaultsDto
  ): Promise<QueueResult<void>> {
    const { signer, ...rest } = corporateActionDefaultsDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.corporateActions.setDefaults, rest as Required<typeof rest>, {
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
}
