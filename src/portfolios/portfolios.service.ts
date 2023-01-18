import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { DefaultPortfolio, NumberedPortfolio } from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { AppValidationError } from '~/common/errors';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { ModifyPortfolioDto } from '~/portfolios/dto/modify-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

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
    if (portfolioId) {
      return await identity.portfolios.getPortfolio({ portfolioId }).catch(handleSdkError);
    }
    return await identity.portfolios.getPortfolio().catch(handleSdkError);
  }

  public async moveAssets(owner: string, params: AssetMovementDto): ServiceReturn<void> {
    const {
      base,
      args: { to, items, from },
    } = extractTxBase(params);

    const fromPortfolio = await this.findOne(owner, toPortfolioId(from));
    const formattedArgs = {
      to: toPortfolioId(to),
      items: items.map(({ ticker: asset, amount, memo }) => {
        return {
          asset,
          amount: new BigNumber(amount),
          memo,
        };
      }),
    };

    return this.transactionsService.submit(fromPortfolio.moveFunds, formattedArgs, base);
  }

  public async createPortfolio(params: CreatePortfolioDto): ServiceReturn<NumberedPortfolio> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const { base, args } = extractTxBase(params);

    return this.transactionsService.submit(polymeshApi.identities.createPortfolio, args, base);
  }

  public async deletePortfolio(
    portfolio: PortfolioDto,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const identity = await this.identitiesService.findOne(portfolio.did);
    return this.transactionsService.submit(
      identity.portfolios.delete,
      { portfolio: portfolio.id },
      transactionBaseDto
    );
  }

  public async updatePortfolioName(
    portfolioParams: PortfolioDto,
    params: ModifyPortfolioDto
  ): ServiceReturn<NumberedPortfolio> {
    const { did, id } = portfolioParams;

    if (id.lte(0)) {
      throw new AppValidationError('Default portfolio name cannot be modified');
    }

    const { base, args } = extractTxBase(params);
    const portfolio = (await this.findOne(did, id)) as NumberedPortfolio;

    return this.transactionsService.submit(portfolio.modifyName, args, base);
  }
}
