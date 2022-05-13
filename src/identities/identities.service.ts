import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';
import { ISubmittableResult } from '@polkadot/types/types';
import {
  Asset,
  AuthorizationRequest,
  ErrorCode,
  Identity,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { processQueue, QueueResult } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class IdentitiesService {
  private alicePair: KeyringPair;
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly signingService: SigningService
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
    const api = this.polymeshService.polymeshApi._polkadotApi;

    if (!api.tx.testUtils) {
      throw new BadRequestException(
        'The chain does not have the `testUtils` pallet enabled. This endpoint is intended for development use only'
      );
    }

    if (!this.alicePair) {
      const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
      this.alicePair = keyring.addFromUri('//Alice');
    }

    let success: (value: unknown) => void;
    let fail: (reason: HttpException) => void;
    const signal = new Promise((resolve, reject) => {
      success = resolve;
      fail = reject;
    });

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const handlePolkadotErrors = (events: EventRecord[], method: 'mockCdd' | 'balance') => {
      const errorEvents = events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event));
      if (errorEvents.length) {
        const exception =
          method === 'mockCdd'
            ? new BadRequestException(
                `Unable to create a mock Identity for address: "${address}". Perhaps it is already linked to an Identity or Alice is unable to create CDD claims on the chain`
              )
            : new InternalServerErrorException(
                `Unable to set initial balance for ${address}. Perhaps Alice lacks sudo permissions`
              );
        fail(exception);
      }
    };

    await api.tx.testUtils
      .mockCddRegisterDid(address)
      .signAndSend(this.alicePair, ({ status, events }: ISubmittableResult) => {
        if (status.isInBlock || status.isFinalized) {
          handlePolkadotErrors(events, 'mockCdd');
        }

        if (status.isInBlock) {
          const setBalance = api.tx.balances.setBalance(address, initialPolyx.toNumber(), 0);
          api.tx.sudo
            .sudo(setBalance)
            .signAndSend(
              this.alicePair,
              async ({ status: balanceStatus, events: balanceEvents }: ISubmittableResult) => {
                if (balanceStatus.isFinalized) {
                  handlePolkadotErrors(balanceEvents, 'balance');
                  success('ok');
                }
              }
            );
        }
      });

    await signal;

    const targetAccount = this.polymeshService.polymeshApi.accountManagement.getAccount({
      address,
    });

    const id = await targetAccount.getIdentity();

    if (!id) {
      throw new InternalServerErrorException('The Identity was not created');
    }

    return id;
  }
}
