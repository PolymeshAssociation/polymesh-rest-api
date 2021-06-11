import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { IsUppercase, MaxLength } from 'class-validator';

import { TokenDetailsDto } from '~/tokens/dto/token-details.dto';
import { MAX_TICKER_LENGTH } from '~/tokens/tokens.consts';
import { TokensService } from '~/tokens/tokens.service';

class FindOneParams {
  @MaxLength(MAX_TICKER_LENGTH)
  @IsUppercase()
  readonly ticker: string;
}

@ApiTags('tokens')
@Controller('tokens')
@UseInterceptors(ClassSerializerInterceptor)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get(':ticker')
  @ApiParam({
    type: 'string',
    name: 'ticker',
  })
  public findOne(@Param() { ticker }: FindOneParams): Promise<TokenDetailsDto> {
    return this.tokensService.findOne(ticker);
  }
}
