import { Injectable } from '@nestjs/common';
import { NumberedPortfolio } from '@polymathnetwork/polymesh-sdk/internal';
import { DefaultPortfolio } from '@polymathnetwork/polymesh-sdk/types';

import { IdentitiesService } from '~/identities/identities.service';

@Injectable()
export class PortfoliosService {
  constructor(private readonly identitiesService: IdentitiesService) {}

  public async findAllByOwner(did: string): Promise<[DefaultPortfolio, ...NumberedPortfolio[]]> {
    const identity = await this.identitiesService.findOne(did);
    return identity.portfolios.getPortfolios();
  }
}
