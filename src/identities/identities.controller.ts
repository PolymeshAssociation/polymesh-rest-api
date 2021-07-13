import {
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Get,
  Logger,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { AuthorizationTypeParams, DidParams } from '~/common/dto/params.dto';
import { PortfolioDto } from '~/common/dto/portfolio.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { TokensService } from '~/tokens/tokens.service';

import { IdentitiesService } from './identities.service';

@ApiTags('identities')
@Controller('identities')
@UseInterceptors(ClassSerializerInterceptor)
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
    summary: 'Get identity details',
    description: 'This api will allow you to give the basic details of an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose details are to be fetched',
    type: 'string',
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns basic details of identity',
    type: IdentityModel,
  })
  async getIdentityDetails(@Param() { did }: DidParams): Promise<IdentityModel> {
    this.logger.debug(`Method begins here for did ${did}`);
    const identity = await this.identitiesService.findOne(did);
    const identityModel = await this.identitiesService.parseIdentity(identity);
    return identityModel;
  }

  @ApiOperation({
    summary: 'Get pending authorizations received by an identity',
    description:
      'This api will provide list of all the pending authorizations received by an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose pending authorizations are to be fetched',
    type: 'string',
    required: true,
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
    description: 'Indicates whether to include expired authorizations or not',
    type: 'boolean',
    required: false,
  })
  @ApiOkResponse({
    description: 'List of all pending authorizations received by the identity',
    type: AuthorizationRequestModel,
    isArray: true,
  })
  @Get(':did/authorizations')
  async getPendingAuthorizations(
    @Param() { did }: DidParams,
    @Query() { type }: AuthorizationTypeParams,
    @Query('includeExpired', new DefaultValuePipe(true)) includeExpired?: boolean
  ): Promise<AuthorizationRequestModel[]> {
    this.logger.debug(`Fetching pending authorization received by did ${did}`);

    const identity = await this.identitiesService.findOne(did);

    const receivedPendingAuthorizations = await identity.authorizations.getReceived({
      includeExpired,
      type,
    });
    const receivedAuthorizations = [];
    for (const request of receivedPendingAuthorizations) {
      receivedAuthorizations.push(
        await this.authorizationsService.parseAuthorizationRequest(request)
      );
    }
    return receivedAuthorizations;
  }

  @ApiOperation({
    summary: 'Get requested authorizations by an identity',
    description: 'This api will provide list of all the authorizations added by an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose pending authorizations are to be fetched',
    type: 'string',
    required: true,
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of pending authorizations to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which values are to be fetched',
    type: 'number',
    required: false,
  })
  @ApiArrayResponse(AuthorizationRequestModel, {
    paginated: true,
  })
  @Get(':did/authorizations/request')
  async getRequestedAuthorizations(
    @Param() { did }: DidParams,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<AuthorizationRequestModel>> {
    this.logger.debug(`Fetching requested authorizations for ${did} from start`);

    const identity = await this.identitiesService.findOne(did);

    const requestedAuthorizations = await identity.authorizations.getSent({
      size,
      start: start?.toString(),
    });

    const authorizationRequests: AuthorizationRequestModel[] = [];
    if (requestedAuthorizations.data?.length > 0) {
      for (const request of requestedAuthorizations.data) {
        authorizationRequests.push(
          await this.authorizationsService.parseAuthorizationRequest(request)
        );
      }
    }

    return {
      results: authorizationRequests,
      total: requestedAuthorizations.count,
      next: requestedAuthorizations.next,
    } as PaginatedResultsModel<AuthorizationRequestModel>;
  }

  @ApiTags('portfolios')
  @ApiOperation({
    summary: 'Get all portfolios of an identity',
    description: 'This api will provide list of all the portfolios of that identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose portfolios are to be fetched',
    type: 'string',
    required: true,
  })
  @ApiOkResponse({
    description: 'Return the list of all portfolios of the given identity',
    type: PortfolioDto,
    isArray: true,
  })
  @Get(':did/portfolios')
  async getPortfolios(@Param() { did }: DidParams): Promise<PortfolioModel[]> {
    this.logger.debug(`Fetching portfolios for ${did}`);
    const identity = await this.identitiesService.findOne(did);

    const portfolios = await identity.portfolios.getPortfolios();

    const portfolioDetails = [];
    for (const portfolio of portfolios) {
      const details = await this.portfoliosService.parsePortfolio(portfolio, did);
      portfolioDetails.push(details);
    }
    this.logger.debug(`Returning details of ${portfolioDetails.length} portfolios for did ${did}`);
    return portfolioDetails;
  }

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
  public async getTokens(@Param() { did }: DidParams): Promise<ResultsModel<string>> {
    const tokens = await this.tokensService.findAllByOwner(did);

    return { results: tokens.map(({ ticker }) => ticker) };
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
  public async getPendingInstructions(@Param() { did }: DidParams): Promise<ResultsModel<string>> {
    const pendingInstructions = await this.settlementsService.findPendingInstructionsByDid(did);

    return { results: pendingInstructions.map(({ id }) => id.toString()) };
  }

  @ApiTags('settlements')
  @ApiOperation({
    summary: 'Get all venues of an identity',
    description: 'This api will provide list of venues for an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose venues are to be fetched',
    type: 'string',
    required: true,
  })
  @ApiOkResponse({
    description: 'Returns the list of venue ids',
    type: String,
    isArray: true,
  })
  @Get(':did/venues')
  async getVenues(@Param() { did }: DidParams): Promise<ResultsModel<string>> {
    const venues = await this.settlementsService.getUserVenues(did);
    return { results: venues.map(({ id }) => id.toString()) };
  }
}
