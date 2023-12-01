import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddClaimsParams,
  CddClaim,
  ClaimData,
  ClaimScope,
  ClaimType,
  CustomClaimType,
  CustomClaimTypeWithDid,
  ModifyClaimsParams,
  ResultSet,
  RevokeClaimsParams,
  Scope,
} from '@polymeshassociation/polymesh-sdk/types';

import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { RegisterCustomClaimTypeDto } from '~/claims/dto/register-custom-claim-type.dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private transactionsService: TransactionsService
  ) {}

  public async findIssuedByDid(
    target: string,
    includeExpired?: boolean,
    size?: BigNumber,
    start?: BigNumber
  ): Promise<ResultSet<ClaimData>> {
    return await this.polymeshService.polymeshApi.claims.getIssuedClaims({
      target,
      includeExpired,
      size,
      start,
    });
  }

  public async findAssociatedByDid(
    target: string,
    scope?: Scope,
    claimTypes?: ClaimType[],
    includeExpired?: boolean,
    size?: BigNumber,
    start?: BigNumber
  ): Promise<ResultSet<ClaimData>> {
    const identitiesWithClaims =
      await this.polymeshService.polymeshApi.claims.getIdentitiesWithClaims({
        targets: [target],
        scope,
        claimTypes,
        includeExpired,
        size,
        start,
      });
    return {
      data: identitiesWithClaims.data?.[0].claims || [],
      next: identitiesWithClaims.next,
      count: identitiesWithClaims.count,
    };
  }

  public async addClaimsOnDid(modifyClaimsDto: ModifyClaimsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(modifyClaimsDto);

    const { addClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(addClaims, args as AddClaimsParams, options);
  }

  public async editClaimsOnDid(modifyClaimsDto: ModifyClaimsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(modifyClaimsDto);

    const { editClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(editClaims, args as ModifyClaimsParams, options);
  }

  public async revokeClaimsFromDid(modifyClaimsDto: ModifyClaimsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(modifyClaimsDto);

    const { revokeClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(revokeClaims, args as RevokeClaimsParams, options);
  }

  public async findClaimScopesByDid(target: string): Promise<ClaimScope[]> {
    return this.polymeshService.polymeshApi.claims.getClaimScopes({
      target,
    });
  }

  public async findCddClaimsByDid(
    target: string,
    includeExpired = true
  ): Promise<ClaimData<CddClaim>[]> {
    return await this.polymeshService.polymeshApi.claims.getCddClaims({
      target,
      includeExpired,
    });
  }

  public async getCustomClaimTypeByName(name: string): Promise<CustomClaimType | null> {
    return this.polymeshService.polymeshApi.claims.getCustomClaimTypeByName(name);
  }

  public async getCustomClaimTypeById(id: BigNumber): Promise<CustomClaimType | null> {
    return this.polymeshService.polymeshApi.claims.getCustomClaimTypeById(id);
  }

  public async registerCustomClaimType(
    registerCustomClaimTypeDto: RegisterCustomClaimTypeDto
  ): ServiceReturn<BigNumber> {
    const { options, args } = extractTxOptions(registerCustomClaimTypeDto);

    const { registerCustomClaimType } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(
      registerCustomClaimType,
      args as RegisterCustomClaimTypeDto,
      options
    );
  }

  public async getRegisteredCustomClaimTypes(
    size?: BigNumber,
    start?: BigNumber,
    dids?: string[]
  ): Promise<ResultSet<CustomClaimTypeWithDid>> {
    return this.polymeshService.polymeshApi.claims.getAllCustomClaimTypes({ size, start, dids });
  }
}
