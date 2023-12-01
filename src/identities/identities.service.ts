import { Injectable } from '@nestjs/common';
import { KeyringPair } from '@polkadot/keyring/types';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AuthorizationRequest,
  FungibleAsset,
  Identity,
  RegisterIdentityParams,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { RegisterIdentityDto } from '~/identities/dto/register-identity.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class IdentitiesService {
  private alicePair: KeyringPair;

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly transactionsService: TransactionsService
  ) {
    logger.setContext(IdentitiesService.name);
  }

  /**
   * Method to get identity for a specific did
   */
  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return await polymeshApi.identities.getIdentity({ did }).catch(error => {
      throw handleSdkError(error);
    });
  }

  /**
   * Method to get trusting Assets for a specific did
   */
  public async findTrustingAssets(did: string): Promise<FungibleAsset[]> {
    const identity = await this.findOne(did);
    return identity.getTrustingAssets();
  }

  public async findHeldAssets(
    did: string,
    size?: BigNumber,
    start?: BigNumber
  ): Promise<ResultSet<FungibleAsset>> {
    const identity = await this.findOne(did);
    return identity.getHeldAssets({ size, start });
  }

  public async addSecondaryAccount(
    addSecondaryAccountParamsDto: AddSecondaryAccountParamsDto
  ): ServiceReturn<AuthorizationRequest> {
    const {
      options,
      args: { secondaryAccount: targetAccount, permissions, expiry },
    } = extractTxOptions(addSecondaryAccountParamsDto);
    const params = {
      targetAccount,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    const { inviteAccount } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(inviteAccount, params, options);
  }

  public async registerDid(registerIdentityDto: RegisterIdentityDto): ServiceReturn<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;

    const {
      options,
      args: { targetAccount, secondaryAccounts, createCdd, expiry },
    } = extractTxOptions(registerIdentityDto);

    const params = {
      targetAccount,
      secondaryAccounts: secondaryAccounts?.map(({ secondaryAccount, permissions }) => ({
        secondaryAccount,
        permissions: permissions?.toPermissionsLike(),
      })),
      createCdd,
      expiry,
    } as RegisterIdentityParams;

    const { registerIdentity } = polymeshApi.identities;

    return this.transactionsService.submit(registerIdentity, params, options);
  }
}
