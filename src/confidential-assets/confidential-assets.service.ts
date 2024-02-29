import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ConfidentialAsset,
  ConfidentialVenueFilteringDetails,
} from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { BurnConfidentialAssetsDto } from '~/confidential-assets/dto/burn-confidential-assets.dto';
import { CreateConfidentialAssetDto } from '~/confidential-assets/dto/create-confidential-asset.dto';
import { IssueConfidentialAssetDto } from '~/confidential-assets/dto/issue-confidential-asset.dto';
import { ToggleFreezeConfidentialAccountAssetDto } from '~/confidential-assets/dto/toggle-freeze-confidential-account-asset.dto';
import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class ConfidentialAssetsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly confidentialProofsService: ConfidentialProofsService,
    private readonly confidentialAccountsService: ConfidentialAccountsService
  ) {}

  public async findOne(id: string): Promise<ConfidentialAsset> {
    return await this.polymeshService.polymeshApi.confidentialAssets
      .getConfidentialAsset({ id })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async createConfidentialAsset(
    params: CreateConfidentialAssetDto
  ): ServiceReturn<ConfidentialAsset> {
    const { base, args } = extractTxBase(params);

    const createConfidentialAsset =
      this.polymeshService.polymeshApi.confidentialAssets.createConfidentialAsset;
    return this.transactionsService.submit(createConfidentialAsset, args, base);
  }

  public async issue(
    assetId: string,
    params: IssueConfidentialAssetDto
  ): ServiceReturn<ConfidentialAsset> {
    const { base, args } = extractTxBase(params);
    const asset = await this.findOne(assetId);

    return this.transactionsService.submit(asset.issue, args, base);
  }

  public async getVenueFilteringDetails(
    assetId: string
  ): Promise<ConfidentialVenueFilteringDetails> {
    const asset = await this.findOne(assetId);

    return asset.getVenueFilteringDetails();
  }

  public async setVenueFilteringDetails(
    assetId: string,
    params: TransactionBaseDto &
      (
        | { enabled: boolean }
        | {
            allowedVenues: BigNumber[];
          }
        | { disallowedVenues: BigNumber[] }
      )
  ): ServiceReturn<void> {
    const asset = await this.findOne(assetId);

    const { base, args } = extractTxBase(params);

    return this.transactionsService.submit(asset.setVenueFiltering, args, base);
  }

  public async toggleFreezeConfidentialAsset(
    assetId: string,
    base: TransactionBaseDto,
    freeze: boolean
  ): ServiceReturn<void> {
    const asset = await this.findOne(assetId);

    const method = freeze ? asset.freeze : asset.unfreeze;

    return this.transactionsService.submit(method, {}, base);
  }

  public async toggleFreezeConfidentialAccountAsset(
    assetId: string,
    params: ToggleFreezeConfidentialAccountAssetDto,
    freeze: boolean
  ): ServiceReturn<void> {
    const asset = await this.findOne(assetId);

    const { base, args } = extractTxBase(params);

    const method = freeze ? asset.freezeAccount : asset.unfreezeAccount;

    return this.transactionsService.submit(method, args, base);
  }

  public async isConfidentialAccountFrozen(
    assetId: string,
    confidentialAccount: string
  ): Promise<boolean> {
    const asset = await this.findOne(assetId);

    return asset.isAccountFrozen(confidentialAccount);
  }

  public async burnConfidentialAsset(
    assetId: string,
    params: BurnConfidentialAssetsDto
  ): ServiceReturn<ConfidentialAsset> {
    const asset = await this.findOne(assetId);

    const { base, args } = extractTxBase(params);

    const encryptedBalance = await this.confidentialAccountsService.getAssetBalance(
      args.confidentialAccount,
      assetId
    );

    const proof = await this.confidentialProofsService.generateBurnProof(args.confidentialAccount, {
      amount: args.amount,
      encryptedBalance,
    });

    return this.transactionsService.submit(
      asset.burn,
      {
        ...args,
        proof,
      },
      base
    );
  }
}
