import { Controller, Get, Param } from '@nestjs/common';
import { TokensService } from '~/tokens/tokens.service';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get(':ticker')
  public findOne(@Param('ticker') ticker: string) {
    return this.tokensService.findOne(ticker);
  }
}
