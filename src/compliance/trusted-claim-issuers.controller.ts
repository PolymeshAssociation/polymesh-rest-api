import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';

@ApiTags('assets', 'compliance')
@Controller('assets/:ticker/trusted-claim-issuers')
export class TrustedClaimIssuersController {
  constructor(private readonly trustedClaimIssuersService: TrustedClaimIssuersService) {}

  @ApiOperation({
    summary: 'Fetch trusted Claim Issuers of an Asset',
    description:
      'This endpoint will provide the list of all default trusted Claim Issuers of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose trusted Claim Issuers are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(TrustedClaimIssuerModel, {
    description: 'List of trusted Claim Issuers of the Asset',
    paginated: false,
  })
  @Get('')
  public async getTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<TrustedClaimIssuerModel>> {
    const results = await this.trustedClaimIssuersService.find(ticker);
    return new ResultsModel({
      results: results.map(
        ({ identity: { did }, trustedFor }) => new TrustedClaimIssuerModel({ did, trustedFor })
      ),
    });
  }
}
