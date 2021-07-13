import { Controller, DefaultValuePipe, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Claim, ClaimType } from '@polymathnetwork/polymesh-sdk/types';

import { ClaimsService } from '~/claims/claims.service';
import { ClaimsIdentityModel } from '~/claims/model/claims-identity.model';
import { ClaimsModel } from '~/claims/model/claims.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { ClaimTypeParams, DidParams } from '~/common/dto/params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';

@ApiTags('claims')
@Controller(':did/claims')
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(private readonly claimsService: ClaimsService) {}

  @ApiOperation({
    summary: 'Get all issued claims',
    description: 'This api will provide list of all the claims issued by an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose issued claims are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of claims to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which claims are to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired claims or not',
    type: 'boolean',
    required: false,
  })
  @ApiArrayResponse(ClaimsModel, {
    paginated: true,
  })
  @Get('issued')
  async getIssuedClaims(
    @Param() { did }: DidParams,
    @Query() { size, start }: PaginatedParamsDto,
    @Query('includeExpired', new DefaultValuePipe(true)) includeExpired?: boolean
  ): Promise<PaginatedResultsModel<ClaimsModel<Claim>>> {
    this.logger.debug(
      `Fetch ${size} issued claims for did ${did} starting from ${size} with include expired ${includeExpired}`
    );

    const claimsResultSet = await this.claimsService.getIssuedClaims(
      did,
      includeExpired,
      size,
      Number(start)
    );

    const claimsData = [];
    if (claimsResultSet.data?.length > 0) {
      for (const claimData of claimsResultSet.data) {
        const { issuedAt, expiry, claim, target, issuer } = claimData;
        claimsData.push(
          new ClaimsModel({
            issuedAt,
            expiry,
            claim,
            target: { did: target.did },
            issuer: { did: issuer.did },
          })
        );
      }
    }

    return {
      results: claimsData,
      next: claimsResultSet.next,
      total: claimsResultSet.count,
    } as PaginatedResultsModel<ClaimsModel>;
  }

  @ApiOperation({
    summary: 'Get all associated claims',
    description: 'This api will provide list of all the claims associated with an identity',
  })
  @ApiParam({
    name: 'did',
    description: 'The unique did whose associated claims are to be fetched',
    type: 'string',
    required: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of claims to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which claims are to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'includeExpired',
    description: 'Indicates whether to include expired claims or not',
    type: 'boolean',
    required: false,
  })
  @ApiQuery({
    name: 'claimTypes',
    description: 'Comma separated list of claim types for filtering',
    type: 'string',
    required: false,
    isArray: true,
    enum: ClaimType,
  })
  @ApiArrayResponse(ClaimsIdentityModel, {
    paginated: true,
  })
  @Get()
  async getAssociatedClaims(
    @Param() { did }: DidParams,
    @Query() { size, start }: PaginatedParamsDto,
    @Query() { claimTypes }: ClaimTypeParams,
    @Query('includeExpired', new DefaultValuePipe(true)) includeExpired?: boolean
  ): Promise<PaginatedResultsModel<ClaimsIdentityModel>> {
    const identitiesWithClaimsResultSet = await this.claimsService.getIdentitiesWithClaims(
      did,
      undefined,
      claimTypes,
      includeExpired,
      size,
      Number(start)
    );
    const claimsData: ClaimsIdentityModel[] = [];
    if (identitiesWithClaimsResultSet.data?.length > 0) {
      for (const identityWithClaim of identitiesWithClaimsResultSet.data) {
        const { identity, claims } = identityWithClaim;
        const parsedValue = {
          identity: {
            did: identity.did,
          },
          claims: claims.map(
            ({ issuedAt, expiry, claim, target, issuer }) =>
              new ClaimsModel({
                issuedAt,
                expiry,
                claim,
                target: { did: target.did },
                issuer: { did: issuer.did },
              })
          ),
        };
        claimsData.push(parsedValue);
      }
    }

    return {
      results: claimsData,
      next: identitiesWithClaimsResultSet.next,
      total: identitiesWithClaimsResultSet.count,
    } as PaginatedResultsModel<ClaimsIdentityModel>;
  }
}
