import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthorizationRequest, Venue } from '@polymathnetwork/polymesh-sdk/internal';
import { AuthorizationType, Instruction, SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { AuthorizationsFilterDto } from '~/authorizations/dto/authorizations-filter.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { IdentitiesService } from '~/identities/identities.service';
import { createIdentityModel } from '~/identities/identities.util';
import { IdentityModel } from '~/identities/models/identity.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { createPortfolioModel } from '~/portfolios/portfolios.util';
import { SettlementsService } from '~/settlements/settlements.service';
import { TokensService } from '~/tokens/tokens.service';

@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {
  private readonly logger = new Logger(IdentitiesController.name);

  constructor(
    private readonly tokensService: TokensService,
    private readonly settlementsService: SettlementsService,
    private readonly identitiesService: IdentitiesService,
    private readonly authorizationsService: AuthorizationsService,
    private readonly portfoliosService: PortfoliosService
  ) {}

  @Get(':did')
  @ApiOperation({
    summary: 'Get Identity details',
    description: 'This endpoint will allow you to give the basic details of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose details are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Returns basic details of the Identity',
    type: IdentityModel,
  })
  async getIdentityDetails(@Param() { did }: DidDto): Promise<IdentityModel> {
    this.logger.debug(`Get identity details for did ${did}`);
    const identity = await this.identitiesService.findOne(did);
    return createIdentityModel(identity);
  }

  @ApiOperation({
    summary: 'Get pending Authorizations received by an Identity',
    description:
      'This endpoint will provide list of all the pending Authorizations received by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose pending Authorizations are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'type',
    description: 'Authorization type to be filtered',
    type: 'string',
    enum: AuthorizationType,
    required: false,
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired authorizations or not. Defaults to true',
    type: 'boolean',
    required: false,
  })
  @ApiArrayResponse(AuthorizationRequest, {
    description: 'List of all pending authorizations received by the Identity',
    paginated: false,
    example: [
      {
        id: '1',
        expiry: null,
        data: {
          type: 'NoData',
        },
        issuer: '0x6'.padEnd(66, '1a1a'),
        target: {
          type: 'Identity',
          value: '0x0600000000000000000000000000000000000000000000000000000000000000',
        },
      },
    ],
  })
  @Get(':did/pending-authorizations')
  async getPendingAuthorizations(
    @Param() { did }: DidDto,
    @Query() { type, includeExpired }: AuthorizationsFilterDto
  ): Promise<ResultsModel<AuthorizationRequest>> {
    this.logger.debug(`Fetching pending authorization received by did ${did}`);

    const results = await this.authorizationsService.findPendingByDid(did, includeExpired, type);

    return new ResultsModel({ results });
  }

  @ApiOperation({
    summary: 'Get Authorizations issued by an Identity',
    description: 'This endpoint will provide a list of all the Authorizations added by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose issued Authorizations are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of issued Authorizations to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which values are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiArrayResponse(AuthorizationRequest, {
    description: 'List of all Authorizations issued by the Identity',
    paginated: true,
    example: [
      {
        id: '2',
        expiry: null,
        data: {
          type: 'PortfolioCustody',
          value: {
            did: '0x0600000000000000000000000000000000000000000000000000000000000000',
            id: '1',
          },
        },
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        target: {
          type: 'Identity',
          value: '0x6'.padEnd(66, '1a1a'),
        },
      },
    ],
  })
  @Get(':did/issued-authorizations')
  async getIssuedAuthorizations(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<AuthorizationRequest>> {
    this.logger.debug(`Fetching requested authorizations for ${did} from start`);

    const { data, count, next } = await this.authorizationsService.findIssuedByDid(
      did,
      size,
      start?.toString()
    );

    return new PaginatedResultsModel<AuthorizationRequest>({
      results: data,
      total: count,
      next: next,
    });
  }

  @ApiTags('portfolios')
  @ApiOperation({
    summary: 'Get all Portfolios of an Identity',
    description: 'This endpoint will provide list of all the Portfolios of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose Portfolios are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse(PortfolioModel, {
    description: 'Return the list of all Portfolios of the given Identity',
    paginated: false,
  })
  @Get(':did/portfolios')
  async getPortfolios(@Param() { did }: DidDto): Promise<ResultsModel<PortfolioModel>> {
    this.logger.debug(`Fetching portfolios for ${did}`);

    const portfolios = await this.portfoliosService.findAllByOwner(did);

    const results = await Promise.all(
      portfolios.map(portfolio => createPortfolioModel(portfolio, did))
    );

    this.logger.debug(`Returning details of ${portfolios.length} portfolios for did ${did}`);

    return new ResultsModel({ results });
  }

  @ApiTags('tokens')
  @ApiOperation({
    summary: 'Fetch all Security Tokens owned by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose Security Tokens are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TOKEN', 'BAR_TOKEN', 'BAZ_TOKEN'],
  })
  @Get(':did/tokens')
  public async getTokens(@Param() { did }: DidDto): Promise<ResultsModel<SecurityToken>> {
    const tokens = await this.tokensService.findAllByOwner(did);

    return new ResultsModel({ results: tokens });
  }

  @ApiTags('settlements', 'instructions')
  @ApiOperation({
    summary: 'Fetch all pending settlement Instructions where an Identity is involved',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose pending settlement Instructions are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of IDs of all pending Instructions',
    paginated: false,
    example: ['123', '456', '789'],
  })
  @Get(':did/pending-instructions')
  public async getPendingInstructions(
    @Param() { did }: DidDto
  ): Promise<ResultsModel<Instruction>> {
    const pendingInstructions = await this.settlementsService.findPendingInstructionsByDid(did);

    return new ResultsModel({ results: pendingInstructions });
  }

  @ApiTags('settlements')
  @ApiOperation({
    summary: 'Get all Venues owned by an Identity',
    description: 'This endpoint will provide list of venues for an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose Venues are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of IDs of all owned Venues',
    paginated: false,
    example: ['123', '456', '789'],
  })
  @Get(':did/venues')
  async getVenues(@Param() { did }: DidDto): Promise<ResultsModel<Venue>> {
    const results = await this.settlementsService.findVenuesByOwner(did);
    return new ResultsModel({ results });
  }
}
