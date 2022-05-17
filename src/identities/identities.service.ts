import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { ISubmittableResult } from '@polkadot/types/types';
import {
  Asset,
  AuthorizationRequest,
  ErrorCode,
  Identity,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AccountsService } from '~/accounts/accounts.service';
import { processQueue, QueueResult } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';
import { PolkadotTransaction } from '~/identities/identities.util';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class IdentitiesService {
  private alicePair: KeyringPair;

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly signingService: SigningService,
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
  ): Promise<QueueResult<AuthorizationRequest>> {
    const { signer, expiry, permissions, secondaryAccount } = addSecondaryAccountParamsDto;
    const address = await this.signingService.getAddressByHandle(signer);
    const params = {
      targetAccount: secondaryAccount,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    const { inviteAccount } = this.polymeshService.polymeshApi.accountManagement;
    return processQueue(inviteAccount, params, { signingAccount: address });
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

    await this.execTransaction(testUtils.mockCddRegisterDid, address);
    const setBalance = balances.setBalance(address, initialPolyx.shiftedBy(6).toNumber(), 0);
    await this.execTransaction(sudo.sudo, setBalance);

    const id = await targetAccount.getIdentity();

    if (!id) {
      throw new InternalServerErrorException('The Identity was not created');
    }

    return id;
  }

  private async execTransaction(tx: PolkadotTransaction, params: unknown): Promise<void> {
    const txName = tx.method;
    let unsub: Promise<() => void>;
    return new Promise((resolve, reject) => {
      unsub = tx(params as string).signAndSend(this.alicePair, (receipt: ISubmittableResult) => {
        receipt.findRecord('system', 'ExtrinsicFailed');
        const { status } = receipt;
        if (status.isInBlock) {
          this.handlePolkadotErrors(receipt, txName, reject);
          resolve('ok');
        }
      }) as Promise<() => void>;
    }).then(async () => {
      (await unsub)();
    });
  }

  private handlePolkadotErrors(
    receipt: ISubmittableResult,
    method: string,
    reject: (reason: HttpException) => void
  ): void {
    const hasError = !!receipt.findRecord('system', 'ExtrinsicFailed') || receipt.isError;
    if (hasError) {
      let exception: HttpException;
      if (method === 'mockCddRegisterDid') {
        exception = new BadRequestException(
          'Unable to create mock Identity. Perhaps the address is already linked to an Identity or Alice is unable to create CDD claims on the chain'
        );
      } else if (method === 'sudo') {
        exception = new InternalServerErrorException(
          'Unable to set initial balance for given address. Perhaps Alice lacks sudo permissions'
        );
      } else {
        exception = new InternalServerErrorException('Unable to process the request');
      }
      reject(exception);
    }
  }
}
