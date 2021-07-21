import { Controller, DefaultValuePipe, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Claim, ClaimType } from '@polymathnetwork/polymesh-sdk/types';

import { ClaimsService } from '~/claims/claims.service';
import { ClaimModel } from '~/claims/model/claim.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { DidDto, IncludeExpiredFilterDto } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

import { ClaimsFilterDto } from './dto/claims-filter.dto';

@ApiTags('claims')
@Controller(':did/claims')
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(private readonly claimsService: ClaimsService) {}

  @ApiTags('identities')
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
    paginated: true,
  })
  @Get('issued')
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

    const claimsData =
      claimsResultSet.data?.map(
        ({ issuedAt, expiry, claim, target, issuer }) =>
          new ClaimModel({
            issuedAt,
            expiry,
            claim,
            target,
            issuer,
          })
      ) || [];

    return new PaginatedResultsModel({
      results: claimsData,
      next: claimsResultSet.next,
      total: claimsResultSet.count,
    });
  }

  @ApiTags('identities')
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
    paginated: true,
  })
  @Get()
  async getAssociatedClaims(
    @Param() { did }: DidDto,
    @Query() { size, start }: PaginatedParamsDto,
    @Query() { claimTypes }: ClaimsFilterDto,
    @Query('includeExpired', new DefaultValuePipe(true)) includeExpired?: boolean
  ): Promise<ResultsModel<ClaimModel>> {
    const identitiesWithClaimsResultSet = await this.claimsService.findAssociatedByDid(
      did,
      undefined,
      claimTypes,
      includeExpired,
      size,
      Number(start)
    );
    const results = identitiesWithClaimsResultSet.data.map(
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
}
