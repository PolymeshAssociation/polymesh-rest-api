import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
  AuthorizationType,
  Claim,
  ClaimType,
  TickerReservation,
  Venue,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import {
  authorizationRequestResolver,
  createAuthorizationRequestModel,
} from '~/authorizations/authorizations.util';
import { AuthorizationParamsDto } from '~/authorizations/dto/authorization-params.dto';
import { AuthorizationsFilterDto } from '~/authorizations/dto/authorizations-filter.dto';
import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { PendingAuthorizationsModel } from '~/authorizations/models/pending-authorizations.model';
import { ClaimsService } from '~/claims/claims.service';
import { ClaimsFilterDto } from '~/claims/dto/claims-filter.dto';
import { ClaimModel } from '~/claims/models/claim.model';
import { InvestorUniquenessModel } from '~/claims/models/investor-uniqueness.model';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto, IncludeExpiredFilterDto } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';
import { IdentitiesService } from '~/identities/identities.service';
import { createIdentityModel } from '~/identities/identities.util';
import { IdentityModel } from '~/identities/models/identity.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { SettlementsService } from '~/settlements/settlements.service';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly settlementsService: SettlementsService,
    private readonly identitiesService: IdentitiesService,
    private readonly authorizationsService: AuthorizationsService,
    private readonly claimsService: ClaimsService,
    private readonly tickerReservationsService: TickerReservationsService,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(IdentitiesController.name);
  }

  @Get(':did')
  @ApiOperation({
    summary: 'Get Identity details',
    description: 'This endpoint will allow you to give the basic details of an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose details are to be fetched',
    type: 'string',
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

  @ApiTags('authorizations')
  @ApiOperation({
    summary: 'Get pending Authorizations received by an Identity',
    description:
      'This endpoint will provide list of all the pending Authorizations received by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose pending Authorizations are to be fetched',
    type: 'string',
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
  @ApiOkResponse({
    description:
      'List of all pending Authorizations for which the given Identity is either the issuer or the target',
    type: PendingAuthorizationsModel,
  })
  @Get(':did/pending-authorizations')
  async getPendingAuthorizations(
    @Param() { did }: DidDto,
    @Query() { type, includeExpired }: AuthorizationsFilterDto
  ): Promise<PendingAuthorizationsModel> {
    const [pending, issued] = await Promise.all([
      this.authorizationsService.findPendingByDid(did, includeExpired, type),
      this.authorizationsService.findIssuedByDid(did),
    ]);

    let { data: sent } = issued;
    if (sent.length > 0) {
      sent = sent.filter(
        ({ isExpired, data: { type: authType } }) =>
          (includeExpired || !isExpired()) && (!type || type === authType)
      );
    }

    return new PendingAuthorizationsModel({
      received: pending.map(createAuthorizationRequestModel),
      sent: sent.map(createAuthorizationRequestModel),
    });
  }

  @ApiTags('authorizations')
  @ApiOperation({
    summary: 'Get a pending Authorization',
    description:
      'This endpoint will return a specific Authorization issued by or targeting an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the issuer or target Identity of the Authorization being fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Authorization to be fetched',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Details of the Authorization',
    type: AuthorizationRequestModel,
  })
  @Get(':did/pending-authorizations/:id')
  async getPendingAuthorization(
    @Param() { did, id }: AuthorizationParamsDto
  ): Promise<AuthorizationRequestModel> {
    const authorizationRequest = await this.authorizationsService.findOneByDid(did, id);
    return createAuthorizationRequestModel(authorizationRequest);
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch all Assets owned by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Assets are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TICKER', 'BAR_TICKER', 'BAZ_TICKER'],
  })
  @Get(':did/assets')
  public async getAssets(@Param() { did }: DidDto): Promise<ResultsModel<Asset>> {
    const results = await this.assetsService.findAllByOwner(did);
    return new ResultsModel({ results });
  }

  @ApiTags('settlements', 'instructions')
  @ApiOperation({
    summary: 'Fetch all pending settlement Instructions where an Identity is involved',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose pending settlement Instructions are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of IDs of all pending Instructions',
    paginated: false,
    example: ['123', '456', '789'],
  })
  @Get(':did/pending-instructions')
  public async getPendingInstructions(@Param() { did }: DidDto): Promise<ResultsModel<BigNumber>> {
    const { pending } = await this.settlementsService.findPendingInstructionsByDid(did);

    return new ResultsModel({ results: pending.map(({ id }) => id) });
  }

  @ApiTags('settlements')
  @ApiOperation({
    summary: 'Get all Venues owned by an Identity',
    description: 'This endpoint will provide list of venues for an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose Venues are to be fetched',
    type: 'string',
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

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Get all issued Claims',
    description: 'This endpoint will provide a list of all the Claims issued by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose issued Claims are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Claims to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which Claims are to be fetched',
    type: 'string',
    required: false,
    example: '0',
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired Claims or not. Defaults to true',
    type: 'boolean',
    required: false,
  })
  @ApiArrayResponse(ClaimModel, {
    description: 'List of issued Claims for the given DID',
    paginated: true,
  })
  @Get(':did/issued-claims')
  async getIssuedClaims(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto,
    @Query() { includeExpired }: IncludeExpiredFilterDto
  ): Promise<PaginatedResultsModel<ClaimModel<Claim>>> {
    this.logger.debug(
      `Fetch ${size} issued claims for did ${did} starting from ${size} with include expired ${includeExpired}`
    );

    const claimsResultSet = await this.claimsService.findIssuedByDid(
      did,
      includeExpired,
      size,
      new BigNumber(start || 0)
    );

    const claimsData = claimsResultSet.data.map(
      ({ issuedAt, expiry, claim, target, issuer }) =>
        new ClaimModel({
          issuedAt,
          expiry,
          claim,
          target,
          issuer,
        })
    );

    return new PaginatedResultsModel({
      results: claimsData,
      next: claimsResultSet.next,
      total: claimsResultSet.count,
    });
  }

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Get all Claims targeting an Identity',
    description: 'This endpoint will provide a list of all the Claims made about an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose associated Claims are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Claims to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which Claims are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired Claims or not. Defaults to true',
    type: 'boolean',
    required: false,
  })
  @ApiQuery({
    name: 'claimTypes',
    description: 'Claim types for filtering associated Claims',
    type: 'string',
    required: false,
    isArray: true,
    enum: ClaimType,
    example: [ClaimType.Accredited, ClaimType.CustomerDueDiligence],
  })
  @ApiArrayResponse(ClaimModel, {
    description: 'List of associated Claims for the given DID',
    paginated: true,
  })
  @Get(':did/associated-claims')
  async getAssociatedClaims(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto,
    @Query() { claimTypes, includeExpired }: ClaimsFilterDto
  ): Promise<ResultsModel<ClaimModel>> {
    const claimsResultSet = await this.claimsService.findAssociatedByDid(
      did,
      undefined,
      claimTypes,
      includeExpired,
      size,
      new BigNumber(start || 0)
    );
    const results = claimsResultSet.data.map(
      ({ issuedAt, expiry, claim, target, issuer }) =>
        new ClaimModel({
          issuedAt,
          expiry,
          claim,
          target,
          issuer,
        })
    );

    return new ResultsModel({ results });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch all Assets for which an Identity is a trusted Claim Issuer',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Claim Issuer for which the Assets are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of Assets for which the Identity is a trusted Claim Issuer',
    paginated: false,
    example: ['SOME_TICKER', 'RANDOM_TICKER'],
  })
  @Get(':did/trusting-assets')
  async getTrustingAssets(@Param() { did }: DidDto): Promise<ResultsModel<Asset>> {
    const results = await this.identitiesService.findTrustingAssets(did);
    return new ResultsModel({ results });
  }

  // TODO @prashantasdeveloper Update the response codes on the error codes are finalized in SDK
  @ApiOperation({
    summary: 'Add Secondary Account',
    description:
      'This endpoint will send an invitation to a Secondary Account to join the Identity of the signer. It also defines the set of permissions the Secondary Account will have.',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiInternalServerErrorResponse({
    description: "The supplied address is not encoded with the chain's SS58 format",
  })
  @ApiBadRequestResponse({
    description:
      'The target Account is already part of an Identity or already has a pending invitation to join this Identity',
  })
  @Post('/secondary-accounts/invite')
  async addSecondaryAccount(
    @Body() addSecondaryAccountParamsDto: AddSecondaryAccountParamsDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.identitiesService.addSecondaryAccount(
      addSecondaryAccountParamsDto
    );

    return handleServiceResult(serviceResult, authorizationRequestResolver);
  }

  @ApiTags('ticker-reservations')
  @ApiOperation({
    summary: 'Fetch all tickers reserved by an Identity',
    description:
      "This endpoint provides all the tickers currently reserved by an Identity. This doesn't include Assets that have already been created. Tickers with unreadable characters in them will be left out",
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose reserved tickers are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of tickers',
    paginated: false,
    example: ['SOME_TICKER', 'RANDOM_TICKER'],
  })
  @Get(':did/ticker-reservations')
  public async getTickerReservations(
    @Param() { did }: DidDto
  ): Promise<ResultsModel<TickerReservation>> {
    const results = await this.tickerReservationsService.findAllByOwner(did);
    return new ResultsModel({ results });
  }

  @ApiOperation({
    summary: 'Creates a fake Identity for an Account and sets its POLYX balance (DEV ONLY)',
    description:
      'This endpoint creates a Identity for an Account and sets its POLYX balance. Will only work with development chains. Alice must exist, be able to call `testUtils.mockCddRegisterDid` and have `sudo` permission',
  })
  @ApiOkResponse({ description: 'The details of the newly created Identity' })
  @ApiBadRequestResponse({
    description:
      'This instance of the REST API is pointing to a chain that lacks development features. A proper CDD provider must be used instead',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to execute an extrinsic, or something unexpected',
  })
  @Post('/mock-cdd')
  public async createMockCdd(@Body() params: CreateMockIdentityDto): Promise<IdentityModel> {
    const identity = await this.identitiesService.createMockCdd(params);
    return createIdentityModel(identity);
  }

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Retrieve the list of InvestorUniqueness claims for a target Identity',
    description:
      'This endpoint will provide a list of all the InvestorUniquenessClaims made about an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which to fetch InvestorUniquenessClaims',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'includeExpired',
    description:
      'Indicates whether to include expired InvestorUniquenessClaims or not. Defaults to true',
    type: 'boolean',
    required: false,
  })
  @ApiArrayResponse(InvestorUniquenessModel, {
    description: 'List of InvestorUniquenessClaims for the given DID',
    paginated: false,
  })
  @Get(':did/investor-uniqueness-claims')
  async getInvestorUniquenessClaims(
    @Param() { did }: DidDto,
    @Query() { includeExpired }: IncludeExpiredFilterDto
  ): Promise<InvestorUniquenessModel[]> {
    const investorUniquenessClaims = await this.claimsService.getInvestorUniquenessClaims(
      did,
      includeExpired
    );

    const results = investorUniquenessClaims.map(
      ({ issuedAt, expiry, claim, target, issuer }) =>
        new InvestorUniquenessModel({
          issuedAt,
          expiry,
          claim,
          target,
          issuer,
        })
    );

    return results;
  }
}
