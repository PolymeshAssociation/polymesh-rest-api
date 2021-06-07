import { Controller, Get, Param } from '@nestjs/common';
import { IdentitiesService } from '~/identities/identities.service';
import { TokensService } from '~/tokens/tokens.service';

@Controller('identities')
export class IdentitiesController {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly tokensService: TokensService
  ) {}

  @Get(':did/tokens')
  public getTokens(@Param('did') did: string) {
    return this.tokensService.findAllByOwner(did);
  }
}
