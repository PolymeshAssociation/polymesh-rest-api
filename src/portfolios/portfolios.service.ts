import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { MoveFundsParams, NumberedPortfolio } from '@polymathnetwork/polymesh-sdk/internal';
import { DefaultPortfolio, ErrorCode, isPolymeshError } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { processQueue } from '~/common/utils/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
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
    portfolioId?: BigNumber
  ): Promise<DefaultPortfolio | NumberedPortfolio> {
    const identity = await this.identitiesService.findOne(did);
    try {
      if (portfolioId) {
        return await identity.portfolios.getPortfolio({ portfolioId });
      } else {
        return await identity.portfolios.getPortfolio();
      }
    } catch (err) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (code === ErrorCode.ValidationError && message.startsWith("The Portfolio doesn't")) {
          throw new NotFoundException(`There is no portfolio with ID: "${portfolioId}"`);
        }
      }
      throw err;
    }
  }

  public async moveAssets(owner: string, params: AssetMovementDto): Promise<TransactionQueueModel> {
    const { signer, to, items, from } = params;
    const fromPortfolio = await this.findOne(owner, toPortfolioId(from));
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const args: MoveFundsParams = {
      to: toPortfolioId(to),
      items: items.map(({ ticker: token, amount, memo }) => {
        return {
          token,
          amount: new BigNumber(amount),
          memo,
        };
      }),
    };
    return processQueue(fromPortfolio.moveFunds, args, { signer: address });
  }
}
