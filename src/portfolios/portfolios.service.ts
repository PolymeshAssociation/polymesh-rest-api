import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  DefaultPortfolio,
  ErrorCode,
  NumberedPortfolio,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class PortfoliosService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly identitiesService: IdentitiesService,
    private readonly transactionsService: TransactionsService
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

  public async moveAssets(owner: string, params: AssetMovementDto): ServiceReturn<void> {
    const { signer, webhookUrl, to, items, from } = params;
    const fromPortfolio = await this.findOne(owner, toPortfolioId(from));
    const args = {
      to: toPortfolioId(to),
      items: items.map(({ ticker: asset, amount, memo }) => {
        return {
          asset,
          amount: new BigNumber(amount),
          memo,
        };
      }),
    };
    return this.transactionsService.submit(fromPortfolio.moveFunds, args, { signer, webhookUrl });
  }

  public async createPortfolio(params: CreatePortfolioDto): ServiceReturn<NumberedPortfolio> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const { signer, webhookUrl, ...rest } = params;
    return this.transactionsService.submit(polymeshApi.identities.createPortfolio, rest, {
      signer,
      webhookUrl,
    });
  }

  public async deletePortfolio(
    portfolio: PortfolioDto,
    signer: string,
    webhookUrl?: string
  ): ServiceReturn<void> {
    const identity = await this.identitiesService.findOne(portfolio.did);
    return this.transactionsService.submit(
      identity.portfolios.delete,
      { portfolio: portfolio.id },
      { signer, webhookUrl }
    );
  }
}
