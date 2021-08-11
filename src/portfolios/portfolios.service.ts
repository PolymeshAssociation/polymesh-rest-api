import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { MoveFundsParams, NumberedPortfolio } from '@polymathnetwork/polymesh-sdk/internal';
import { DefaultPortfolio, isPolymeshError } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { processQueue } from '~/common/utils/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PortfolioTransferDto } from '~/portfolios/dto/portfolio-transfer.dto';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class PortfoliosService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findAllByOwner(did: string): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    const identity = await this.identitiesService.findOne(did);
    return identity.portfolios.getPortfolios();
  }

  public async findOne(
    did: string,
    portfolioId: BigNumber
  ): Promise<DefaultPortfolio | NumberedPortfolio> {
    const identity = await this.identitiesService.findOne(did);
    try {
      if (portfolioId.eq(0)) {
        return await identity.portfolios.getPortfolio();
      } else {
        return await identity.portfolios.getPortfolio({ portfolioId });
      }
    } catch (err) {
      if (isPolymeshError(err)) {
        const { message } = err;
        if (message.startsWith("The Portfolio doesn't")) {
          throw new NotFoundException(`There is no portfolio with ID: ${portfolioId}`);
        }
      }
      throw err;
    }
  }

  public async moveAssets(
    fromId: BigNumber,
    params: PortfolioTransferDto
  ): Promise<TransactionQueueModel> {
    const { signer, ...rest } = params;
    const fromPortfolio = await this.findOne(signer, fromId);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const args: MoveFundsParams = {
      to: rest.to,
      items: rest.items.map(i => {
        return {
          token: i.ticker,
          amount: new BigNumber(i.amount),
          memo: i.memo,
        };
      }),
    };
    return processQueue(fromPortfolio.moveFunds, args, { signer: address });
  }
}
