import { Injectable, NotFoundException } from '@nestjs/common';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class TokensService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async findOne(ticker: string) {
    try {
      const token = await this.polymeshService.polymeshApi.getSecurityToken({ ticker });

      const {
        owner: { did: owner },
        assetType,
        name,
        totalSupply,
        primaryIssuanceAgent: { did: pia },
        isDivisible,
      } = await token.details();

      return {
        owner,
        assetType,
        name,
        totalSupply,
        pia,
        isDivisible,
      };
    } catch (err: unknown) {
      if (err instanceof PolymeshError) {
        const { message } = err;
        if (message.startsWith('There is no Security Token with ticker')) {
          throw new NotFoundException(message);
        }
      }

      throw err;
    }
  }

  public async findAllByOwner(owner: string) {
    const tokens = await this.polymeshService.polymeshApi.getSecurityTokens({ owner });

    return tokens.map(({ ticker }) => ticker);
  }
}
