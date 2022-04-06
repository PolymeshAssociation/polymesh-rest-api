import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  DefaultPortfolio,
  ErrorCode,
  NumberedPortfolio,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { processQueue, QueueResult } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AssetMovementDto } from '~/portfolios/dto/asset-movement.dto';
import { CreatePortfolioDto } from '~/portfolios/dto/create-portfolio.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class PortfoliosService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly identitiesService: IdentitiesService,
    private readonly signingService: SigningService
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

  public async moveAssets(owner: string, params: AssetMovementDto): Promise<QueueResult<void>> {
    const { signer, to, items, from } = params;
    const fromPortfolio = await this.findOne(owner, toPortfolioId(from));
    const address = await this.signingService.getAddressByHandle(signer);
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
    return processQueue(fromPortfolio.moveFunds, args, { signingAccount: address });
  }

  public async createPortfolio(
    params: CreatePortfolioDto
  ): Promise<QueueResult<NumberedPortfolio>> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const { signer, ...rest } = params;
    const address = await this.signingService.getAddressByHandle(signer);
    return processQueue(polymeshApi.identities.createPortfolio, rest, { signingAccount: address });
  }

  public async deletePortfolio(
    portfolio: PortfolioDto,
    signer: string
  ): Promise<QueueResult<void>> {
    const address = await this.signingService.getAddressByHandle(signer);
    const identity = await this.identitiesService.findOne(portfolio.did);
    return processQueue(
      identity.portfolios.delete,
      { portfolio: portfolio.id },
      { signingAccount: address }
    );
  }
}
