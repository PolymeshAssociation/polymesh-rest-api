import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  Asset,
  AuthorizationRequest,
  ErrorCode,
  Identity,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AccountsService } from '~/accounts/accounts.service';
import { ServiceReturn } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class IdentitiesService {
  private alicePair: KeyringPair;

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService
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
    try {
      return await polymeshApi.identities.getIdentity({ did });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          this.logger.error(`No valid identity found for did "${did}"`);
          throw new NotFoundException(`There is no Identity with DID "${did}"`);
        }
      }
      throw err;
    }
  }

  /**
   * Method to get trusting Assets for a specific did
   */
  public async findTrustingAssets(did: string): Promise<Asset[]> {
    const identity = await this.findOne(did);
    return identity.getTrustingAssets();
  }

  public async addSecondaryAccount(
    addSecondaryAccountParamsDto: AddSecondaryAccountParamsDto
  ): ServiceReturn<AuthorizationRequest> {
    const { signer, webhookUrl, expiry, permissions, secondaryAccount } =
      addSecondaryAccountParamsDto;

    const params = {
      targetAccount: secondaryAccount,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    const { inviteAccount } = this.polymeshService.polymeshApi.accountManagement;
    return this.transactionsService.submit(inviteAccount, params, { signer, webhookUrl });
  }

  /**
   * @note intended for development chains only (i.e. Alice exists and can call `testUtils.createMockCddClaim`)
   */
  public async createMockCdd({ address, initialPolyx }: CreateMockIdentityDto): Promise<Identity> {
    const {
      _polkadotApi: {
        tx: { testUtils, balances, sudo },
      },
      network,
    } = this.polymeshService.polymeshApi;

    if (!testUtils) {
      throw new BadRequestException(
        'The chain does not have the `testUtils` pallet enabled. This endpoint is intended for development use only'
      );
    }

    const targetAccount = await this.accountsService.findOne(address);

    if (!this.alicePair) {
      const ss58Format = network.getSs58Format().toNumber();
      const keyring = new Keyring({ type: 'sr25519', ss58Format });
      this.alicePair = keyring.addFromUri('//Alice');
    }

    await this.polymeshService.execTransaction(
      this.alicePair,
      testUtils.mockCddRegisterDid,
      address
    );
    const setBalance = balances.setBalance(address, initialPolyx.shiftedBy(6).toNumber(), 0);
    await this.polymeshService.execTransaction(this.alicePair, sudo.sudo, setBalance);

    const id = await targetAccount.getIdentity();

    if (!id) {
      throw new InternalServerErrorException('The Identity was not created');
    }

    return id;
  }
}
