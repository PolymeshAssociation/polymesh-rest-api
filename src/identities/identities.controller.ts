import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthorizationRequest, Venue } from '@polymathnetwork/polymesh-sdk/internal';
import {
  AuthorizationType,
  Claim,
  ClaimType,
  Instruction,
  SecurityToken,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { AuthorizationsFilterDto } from '~/authorizations/dto/authorizations-filter.dto';
import { ClaimsService } from '~/claims/claims.service';
import { ClaimsFilterDto } from '~/claims/dto/claims-filter.dto';
import { ClaimModel } from '~/claims/model/claim.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto, IncludeExpiredFilterDto } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { AddSecondaryKeysParamsDto } from '~/identities/dto/add-secondary-keys-params.dto';
import { IdentitiesService } from '~/identities/identities.service';
import { createIdentityModel } from '~/identities/identities.util';
import { IdentityModel } from '~/identities/models/identity.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { SettlementsService } from '~/settlements/settlements.service';

@ApiTags('identities')
@Controller('identities')
export class IdentitiesController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly settlementsService: SettlementsService,
    private readonly identitiesService: IdentitiesService,
    private readonly authorizationsService: AuthorizationsService,
    private readonly claimsService: ClaimsService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(IdentitiesController.name);
  }

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

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch all Assets owned by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose Assets are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    paginated: false,
    example: ['FOO_TOKEN', 'BAR_TOKEN', 'BAZ_TOKEN'],
  })
  @Get(':did/assets')
  public async getAssets(@Param() { did }: DidDto): Promise<ResultsModel<SecurityToken>> {
    const results = await this.assetsService.findAllByOwner(did);
    return new ResultsModel({ results });
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

  @ApiTags('claims')
  @ApiOperation({
    summary: 'Get all issued Claims',
    description: 'This endpoint will provide a list of all the Claims issued by an Identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID whose issued Claims are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Claims to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which Claims are to be fetched',
    type: 'number',
    required: false,
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
      Number(start)
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
    description: 'The DID whose associated Claims are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Claims to be fetched',
    type: 'number',
    required: false,
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
      Number(start)
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
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiArrayResponse('string', {
    description: 'List of Assets for which the Identity is a trusted Claim Issuer',
    paginated: false,
    example: ['BAR_TOKEN', 'FOO_TOKEN'],
  })
  @Get(':did/trusting-tokens')
  async getTrustingTokens(@Param() { did }: DidDto): Promise<ResultsModel<SecurityToken>> {
    const results = await this.identitiesService.findTrustingTokens(did);
    return new ResultsModel({ results });
  }

  // TODO @prashantasdeveloper Update the response codes on the error codes are finalized in SDK
  @ApiOperation({
    summary: 'Add Secondary Key',
    description:
      'This endpoint will send an invitation to an Secondary Key to join an Identity. It also defines set of permissions the Secondary Keys will have.',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiInternalServerErrorResponse({
    description: "The supplied address is not encoded with the chain's SS58 format",
  })
  @ApiBadRequestResponse({
    description:
      'The target Account is already part of an Identity or already has a pending invitation to join this Identity',
  })
  @Post('/secondary-keys')
  async addSecondaryKeys(
    @Body() addSecondaryKeysParamsDto: AddSecondaryKeysParamsDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.identitiesService.addSecondaryKeys(
      addSecondaryKeysParamsDto
    );
    return new TransactionQueueModel({ transactions });
  }
}
