import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { IsTicker } from '~/common/decorators/validation';
import { TokenDetailsDto } from '~/tokens/dto/token-details.dto';
import { TokensService } from '~/tokens/tokens.service';

class TickerParams {
  @IsTicker()
  readonly ticker: string;
}

@ApiTags('tokens')
@Controller('tokens')
@UseInterceptors(ClassSerializerInterceptor)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @ApiOperation({
    summary: "Fetch a Security Token's details",
  })
  @ApiParam({
    type: 'string',
    name: 'ticker',
  })
  @Get(':ticker')
  public async findOne(@Param() { ticker }: TickerParams): Promise<TokenDetailsDto> {
    const {
      owner,
      assetType,
      name,
      totalSupply,
      primaryIssuanceAgent: pia,
      isDivisible,
    } = await this.tokensService.findDetails(ticker);

    return new TokenDetailsDto({
      owner,
      assetType,
      name,
      totalSupply,
      pia,
      isDivisible,
    });
  }
}
