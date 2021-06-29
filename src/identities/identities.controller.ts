import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

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
@UseInterceptors(ClassSerializerInterceptor)
export class IdentitiesController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly settlementsService: SettlementsService
  ) {}

  @ApiTags('tokens')
  @ApiParam({
    type: 'string',
    name: 'did',
  })
  @Get(':did/tokens')
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TOKEN', 'BAR_TOKEN', 'BAZ_TOKEN'],
  })
  public async getTokens(@Param() { did }: DidParams): Promise<ResultsDto<string>> {
    const tokens = await this.tokensService.findAllByOwner(did);

    return { results: tokens.map(({ ticker }) => ticker) };
  }

  @ApiTags('settlements', 'instructions')
  @ApiParam({
    type: 'string',
    name: 'did',
  })
  @Get(':did/pending-instructions')
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['123', '456', '789'],
  })
  public async getPendingInstructions(@Param() { did }: DidParams): Promise<ResultsDto<string>> {
    const pendingInstructions = await this.settlementsService.findPendingInstructionsByDid(did);

    return { results: pendingInstructions.map(({ id }) => id.toString()) };
  }
}
