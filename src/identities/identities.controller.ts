import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { IsHexadecimal, Length, Matches } from 'class-validator';

import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsDto } from '~/common/dto/results.dto';
import { DID_LENGTH } from '~/identities/identities.consts';
import { IdentitiesService } from '~/identities/identities.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { TokensService } from '~/tokens/tokens.service';

class GetByDidParams {
  @IsHexadecimal({
    message: 'DID must be a hexadecimal number',
  })
  @Matches(/^0x.+/, {
    message: 'DID must start with "0x"',
  })
  @Length(DID_LENGTH, undefined, {
    message: 'DID must be 66 characters long',
  })
  readonly did: string;
}

@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {
  constructor(
    private readonly identitiesService: IdentitiesService,
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
  public getTokens(@Param() { did }: GetByDidParams): Promise<ResultsDto<string>> {
    return this.tokensService.findAllByOwner(did);
  }

  @ApiTags('settlements')
  @ApiParam({
    type: 'string',
    name: 'did',
  })
  @Get(':did/pending-instructions')
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TOKEN', 'BAR_TOKEN', 'BAZ_TOKEN'],
  })
  public getPendingInstructions(@Param() { did }: GetByDidParams): Promise<ResultsDto<string>> {
    return this.settlementsService.findPendingInstructionsByDid(did);
  }
}
