import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Instruction, SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IsDid } from '~/common/decorators/validation';
import { ResultsDto } from '~/common/dto/results.dto';
import { SettlementsService } from '~/settlements/settlements.service';
import { TokensService } from '~/tokens/tokens.service';

class DidParams {
  @IsDid()
  readonly did: string;
}

@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly settlementsService: SettlementsService
  ) {}

  @ApiTags('tokens')
  @ApiOperation({
    summary: 'Fetch all Security Tokens owned by an Identity',
  })
  @ApiParam({
    type: 'string',
    name: 'did',
  })
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TOKEN', 'BAR_TOKEN', 'BAZ_TOKEN'],
  })
  @Get(':did/tokens')
  public async getTokens(@Param() { did }: DidParams): Promise<ResultsDto<SecurityToken>> {
    const tokens = await this.tokensService.findAllByOwner(did);

    return new ResultsDto({ results: tokens });
  }

  @ApiTags('settlements', 'instructions')
  @ApiOperation({
    summary: 'Fetch all pending settlement Instructions where an Identity is involved',
  })
  @ApiParam({
    type: 'string',
    name: 'did',
  })
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['123', '456', '789'],
  })
  @Get(':did/pending-instructions')
  public async getPendingInstructions(
    @Param() { did }: DidParams
  ): Promise<ResultsDto<Instruction>> {
    const pendingInstructions = await this.settlementsService.findPendingInstructionsByDid(did);

    return new ResultsDto({ results: pendingInstructions });
  }
}
