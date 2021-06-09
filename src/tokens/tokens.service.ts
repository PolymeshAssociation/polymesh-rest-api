import { Injectable, NotFoundException } from '@nestjs/common';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';

import { ResultsDto } from '~/common/dto/results.dto';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TokenDetailsDto } from '~/tokens/dto/token-details.dto';

@Injectable()
export class TokensService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async findOne(ticker: string): Promise<TokenDetailsDto> {
    try {
      const token = await this.polymeshService.polymeshApi.getSecurityToken({ ticker });

      const {
        owner,
        assetType,
        name,
        totalSupply,
        primaryIssuanceAgent: pia,
        isDivisible,
      } = await token.details();

      return new TokenDetailsDto({
        owner,
        assetType,
        name,
        totalSupply,
        pia,
        isDivisible,
      });
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

  public async findAllByOwner(owner: string): Promise<ResultsDto<string>> {
    const tokens = await this.polymeshService.polymeshApi.getSecurityTokens({ owner });

    return { results: tokens.map(({ ticker }) => ticker) };
  }
}
