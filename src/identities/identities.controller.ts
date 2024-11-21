import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
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
  AuthorizationType,
  Claim,
  ClaimScope,
  ClaimType,
  FungibleAsset,
  NftCollection,
  TickerReservation,
  Venue,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
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
import { CddClaimModel } from '~/claims/models/cdd-claim.model';
import { ClaimModel } from '~/claims/models/claim.model';
import { ClaimScopeModel } from '~/claims/models/claim-scope.model';
import {
  ApiArrayResponse,
  ApiArrayResponseReplaceModelProperties,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators/';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto, IncludeExpiredFilterDto } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { createDividendDistributionDetailsModel } from '~/corporate-actions/corporate-actions.util';
import { DividendDistributionDetailsModel } from '~/corporate-actions/models/dividend-distribution-details.model';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { CreateMockIdentityDto } from '~/developer-testing/dto/create-mock-identity.dto';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { RegisterIdentityDto } from '~/identities/dto/register-identity.dto';
import { RotatePrimaryKeyParamsDto } from '~/identities/dto/rotate-primary-key-params.dto';
import { IdentitiesService } from '~/identities/identities.service';
import { createIdentityModel } from '~/identities/identities.util';
import { CreatedIdentityModel } from '~/identities/models/created-identity.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { createIdentityResolver } from '~/identities/models/identity.util';
import { PreApprovedModel } from '~/identities/models/pre-approved.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { GroupedInstructionModel } from '~/settlements/models/grouped-instructions.model';
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
    private readonly developerTestingService: DeveloperTestingService,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(IdentitiesController.name);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register Identity',
    description:
      'This endpoint allows registering a new Identity. The transaction signer must be a CDD provider. This will create Authorization Requests which have to be accepted by any secondary accounts if they were specified.',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedIdentityModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: ['Expiry cannot be set unless a CDD claim is being created'],
  })
  async registerIdentity(
    @Body() registerIdentityDto: RegisterIdentityDto
  ): Promise<TransactionResponseModel> {
    this.logger.debug('Registering new identity');
    const serviceResult = await this.identitiesService.registerDid(registerIdentityDto);

    return handleServiceResult(serviceResult, createIdentityResolver);
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
  public async getAssets(
    @Param() { did }: DidDto
  ): Promise<ResultsModel<FungibleAsset | NftCollection>> {
    const results = await this.assetsService.findAllByOwner(did);
    return new ResultsModel({ results });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch all Assets held by an Identity',
    description:
      'This endpoint returns a list of all Assets which were held at one point by the given Identity. This requires Polymesh GraphQL Middleware Service',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which held Assets are to be fetched',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description:
      'List of all the held Assets. NOTE: For 6.x chains, asset is represented by its ticker, but from 7.x, asset is represented by its unique Asset ID',
    paginated: true,
    examples: [
      ['3616b82e-8e10-80ae-dc95-2ea28b9db8b3', '3616b82e-8e10-80ae-dc95-2ea28b9db8b3'],
      ['FOO_TICKER', 'BAR_TICKER', 'BAZ_TICKER'],
    ],
  })
  @Get(':did/held-assets')
  public async getHeldAssets(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<ResultsModel<string>> {
    const { data, count, next } = await this.identitiesService.findHeldAssets(
      did,
      size,
      new BigNumber(start || 0)
    );
    return new PaginatedResultsModel({
      results: data.map(({ id }) => id),
      total: count,
      next,
    });
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
    const { pending } = await this.settlementsService.findGroupedInstructionsByDid(did);

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
  async getTrustingAssets(@Param() { did }: DidDto): Promise<ResultsModel<FungibleAsset>> {
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

  @ApiTags('developer-testing')
  @ApiOperation({
    summary:
      'Creates a fake Identity for an Account and sets its POLYX balance (DEPRECATED: Use `/developer-testing/create-test-account` instead)',
    description:
      'This endpoint creates a Identity for an Account and sets its POLYX balance. A sudo account must be configured.',
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
    const identity = await this.developerTestingService.createMockCdd(params);
    return createIdentityModel(identity);
  }

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Fetch all CDD claims for an Identity',
    description: 'This endpoint will fetch the list of CDD claims for a target DID',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose CDD claims are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired CDD claims or not. Defaults to true',
    type: 'boolean',
    required: false,
  })
  @ApiArrayResponseReplaceModelProperties(
    ClaimModel,
    {
      description: 'List of CDD claims for the target DID',
      paginated: false,
    },
    { claim: CddClaimModel }
  )
  @Get(':did/cdd-claims')
  public async getCddClaims(
    @Param() { did }: DidDto,
    @Query() { includeExpired }: IncludeExpiredFilterDto
  ): Promise<ResultsModel<ClaimModel<CddClaimModel>>> {
    const cddClaims = await this.claimsService.findCddClaimsByDid(did, includeExpired);

    const results = cddClaims.map(claim => new ClaimModel<CddClaimModel>(claim));

    return { results };
  }

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Fetch all claim scopes for an Identity',
    description:
      'This endpoint will fetch all scopes in which claims have been made for the given DID.',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity whose claim scopes are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse(ClaimScopeModel, {
    description: 'List of claim scopes',
    paginated: false,
  })
  @Get(':did/claim-scopes')
  public async getClaimScopes(@Param() { did }: DidDto): Promise<ResultsModel<ClaimScope>> {
    const claimResultSet = await this.claimsService.findClaimScopesByDid(did);

    const results = claimResultSet.map(claimScope => new ClaimScopeModel(claimScope));

    return new ResultsModel({ results });
  }

  @Get(':did/grouped-instructions')
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which to get grouped Instructions',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Returns grouped Instructions for the Identity',
    type: GroupedInstructionModel,
  })
  public async getGroupedInstructions(@Param() { did }: DidDto): Promise<GroupedInstructionModel> {
    const result = await this.settlementsService.findGroupedInstructionsByDid(did);

    return new GroupedInstructionModel(result);
  }

  @ApiOperation({
    summary: 'Rotate Primary Key',
    description:
      'Creates an Authorization to rotate primary key of the signing Identity by the `targetAccount`. <br />' +
      'The existing key for the signing Identity will be unlinked once the new primary key is attested.',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiBadRequestResponse({
    description:
      'The target Account already has a pending invitation to become the primary key of the given Identity',
  })
  @Post('rotate-primary-key')
  async rotatePrimaryKey(
    @Body() rotatePrimaryKeyDto: RotatePrimaryKeyParamsDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.identitiesService.rotatePrimaryKey(rotatePrimaryKeyDto);

    return handleServiceResult(serviceResult, authorizationRequestResolver);
  }

  @ApiOperation({
    summary: 'Attest Primary Key Rotation',
    description:
      'The transaction signer must be a CDD provider. <br />' +
      'This will create Authorization Request to accept the `targetAccount` to become as the primary key of the given Identity.',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiBadRequestResponse({
    description:
      'The target Account already has a pending attestation to become the primary key of the target Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which to attest primary key rotation',
  })
  @Post(':did/rotate-primary-key')
  async attestPrimaryKeyRotation(
    @Param() { did }: DidDto,
    @Body() rotatePrimaryKeyDto: RotatePrimaryKeyParamsDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.identitiesService.attestPrimaryKeyRotation(
      did,
      rotatePrimaryKeyDto
    );

    return handleServiceResult(serviceResult, authorizationRequestResolver);
  }

  @ApiOperation({
    summary: 'Check if a Asset is pre-approved for an identity',
    description: 'This endpoint returns wether or not an asset is pre-approved for an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which fetch pre-approved assets for',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'Returns pre-approval status for the asset',
    type: PreApprovedModel,
  })
  @Get(':did/is-pre-approved')
  public async getIsAssetPreApproved(
    @Param() { did }: DidDto,
    @Query() { asset }: AssetParamsDto
  ): Promise<PreApprovedModel> {
    const isPreApproved = await this.identitiesService.isAssetPreApproved(did, asset);

    return new PreApprovedModel({ asset, did, isPreApproved });
  }

  @ApiOperation({
    summary: 'Returns pre-approved assets for the identity',
    description: 'This endpoint returns the tickers the identity has pre-approved',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which fetch pre-approved assets for',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of pre-approved tickers to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which pre-approved tickers are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiOkResponse({
    description: 'Returns pre-approved assets for the identity',
    type: PaginatedResultsModel<PreApprovedModel>,
  })
  @Get(':did/pre-approved-assets')
  public async getPreApprovedAssets(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<PreApprovedModel>> {
    const { data, count, next } = await this.identitiesService.getPreApprovedAssets(
      did,
      size,
      start?.toString()
    );

    return new PaginatedResultsModel({
      results: data.map(({ id }) => new PreApprovedModel({ asset: id, did, isPreApproved: true })),
      total: count,
      next,
    });
  }

  @ApiTags('dividend-distributions')
  @ApiOperation({
    summary: 'Fetch eligible Dividend Distributions',
    description:
      'This endpoint will provide the list of Dividend Distributions that are eligible to be claimed by the current Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the Identity for which fetch pending Dividend Distributions for',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse(DividendDistributionDetailsModel, {
    description:
      'List of Dividend Distributions that are eligible to be claimed by the specified Identity',
    paginated: false,
  })
  @Get(':did/pending-distributions')
  public async getPendingDistributions(
    @Param() { did }: DidDto
  ): Promise<ResultsModel<DividendDistributionDetailsModel>> {
    const results = await this.identitiesService.getPendingDistributions(did);

    return new ResultsModel({
      results: results.map(distributionWithDetails =>
        createDividendDistributionDetailsModel(distributionWithDetails)
      ),
    });
  }
}
