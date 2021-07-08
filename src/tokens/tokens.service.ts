import { Injectable, NotFoundException } from '@nestjs/common';
import {
  isPolymeshError,
  SecurityToken,
  SecurityTokenDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class TokensService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async findOne(ticker: string): Promise<SecurityToken> {
    try {
      const token = await this.polymeshService.polymeshApi.getSecurityToken({ ticker });

      return token;
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;
        if (message.startsWith('There is no Security Token with ticker')) {
          throw new NotFoundException(message);
        }
      }

      throw err;
    }
  }

  public async findDetails(ticker: string): Promise<SecurityTokenDetails> {
    const token = await this.findOne(ticker);

    return token.details();
  }

  public async findAllByOwner(owner: string): Promise<SecurityToken[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    const isDidValid = await polymeshApi.isIdentityValid({ identity: owner });

    if (!isDidValid) {
      throw new NotFoundException(`There is no identity with DID ${owner}`);
    }

    return polymeshApi.getSecurityTokens({ owner });
  }
}
