import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AddClaimsParams,
  ClaimData,
  ClaimType,
  ModifyClaimsParams,
  ResultSet,
  RevokeClaimsParams,
  Scope,
} from '@polymeshassociation/polymesh-sdk/types';

import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
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
    claimTypes?: Exclude<ClaimType, ClaimType.InvestorUniquenessV2>[],
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
    const { base, args } = extractTxBase(modifyClaimsDto);

    const { addClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(addClaims, args as AddClaimsParams, base);
  }

  public async editClaimsOnDid(modifyClaimsDto: ModifyClaimsDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(modifyClaimsDto);

    const { editClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(editClaims, args as ModifyClaimsParams, base);
  }

  public async revokeClaimsFromDid(modifyClaimsDto: ModifyClaimsDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(modifyClaimsDto);

    const { revokeClaims } = this.polymeshService.polymeshApi.claims;

    return this.transactionsService.submit(revokeClaims, args as RevokeClaimsParams, base);
  }
}
