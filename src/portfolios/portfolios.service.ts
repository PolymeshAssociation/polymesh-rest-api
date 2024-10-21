import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AuthorizationRequest,
  DefaultPortfolio,
  EventIdentifier,
  HistoricSettlement,
  NumberedPortfolio,
  PaginationOptions,
  PortfolioMovement,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { AppValidationError } from '~/common/errors';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { ModifyPortfolioDto } from '~/portfolios/dto/modify-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { SetCustodianDto } from '~/portfolios/dto/set-custodian.dto';
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

  public async findOne(did: string): Promise<DefaultPortfolio>;
  public async findOne(did: string, portfolioId: BigNumber): Promise<NumberedPortfolio>;
  public async findOne(
    did: string,
    portfolioId?: BigNumber
  ): Promise<DefaultPortfolio | NumberedPortfolio> {
    const identity = await this.identitiesService.findOne(did);
    if (portfolioId?.gt(0)) {
      return await identity.portfolios.getPortfolio({ portfolioId }).catch(error => {
        throw handleSdkError(error);
      });
    }
    return await identity.portfolios.getPortfolio().catch(error => {
      throw handleSdkError(error);
    });
  }

  public async moveAssets(owner: string, params: AssetMovementDto): ServiceReturn<void> {
    const {
      options,
      args: { to, items, from },
    } = extractTxOptions(params);

    const fromId = toPortfolioId(from);
    const fromPortfolio = fromId ? await this.findOne(owner, fromId) : await this.findOne(owner);

    const formattedArgs = {
      to: toPortfolioId(to),
      items: items.map(({ asset, amount, memo, nfts }) => {
        return {
          asset,
          amount,
          memo,
          nfts,
        } as PortfolioMovement;
      }),
    };

    return this.transactionsService.submit(fromPortfolio.moveFunds, formattedArgs, options);
  }

  public async createPortfolio(params: CreatePortfolioDto): ServiceReturn<NumberedPortfolio> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const { options, args } = extractTxOptions(params);

    return this.transactionsService.submit(polymeshApi.identities.createPortfolio, args, options);
  }

  public async deletePortfolio(
    portfolio: PortfolioDto,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const identity = await this.identitiesService.findOne(portfolio.did);
    const { options } = extractTxOptions(transactionBaseDto);
    return this.transactionsService.submit(
      identity.portfolios.delete,
      { portfolio: portfolio.id },
      options
    );
  }

  public async getCustodiedPortfolios(
    did: string,
    paginationOptions: PaginationOptions
  ): Promise<ResultSet<DefaultPortfolio | NumberedPortfolio>> {
    const identity = await this.identitiesService.findOne(did);

    return identity.portfolios.getCustodiedPortfolios(paginationOptions);
  }

  public async updatePortfolioName(
    portfolioParams: PortfolioDto,
    params: ModifyPortfolioDto
  ): ServiceReturn<NumberedPortfolio> {
    const { did, id } = portfolioParams;

    if (id.lte(0)) {
      throw new AppValidationError('Default portfolio name cannot be modified');
    }

    const { options, args } = extractTxOptions(params);
    const portfolio = await this.findOne(did, id);

    return this.transactionsService.submit(portfolio.modifyName, args, options);
  }

  public async setCustodian(
    did: string,
    portfolioId: BigNumber,
    params: SetCustodianDto
  ): ServiceReturn<AuthorizationRequest> {
    const portfolio = await this.findOne(did, portfolioId);
    const {
      options,
      args: { target: targetIdentity, expiry },
    } = extractTxOptions(params);

    return this.transactionsService.submit(
      portfolio.setCustodian,
      { targetIdentity, expiry },
      options
    );
  }

  public async getTransactions(
    did: string,
    portfolioId: BigNumber,
    account?: string,
    ticker?: string
  ): Promise<HistoricSettlement[]> {
    const portfolio = await this.findOne(did, portfolioId);

    return portfolio.getTransactionHistory({ account, ticker });
  }

  public async quitCustody(
    did: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const portfolio = await this.findOne(did, id);
    const { options } = extractTxOptions(transactionBaseDto);

    return this.transactionsService.submit(portfolio.quitCustody, {}, options);
  }

  public async createdAt(did: string, portfolioId: BigNumber): Promise<EventIdentifier | null> {
    if (portfolioId.lte(0)) {
      throw new AppValidationError('Cannot get event details for Default Portfolio');
    }
    const portfolio = await this.findOne(did, portfolioId);
    return portfolio.createdAt();
  }
}
