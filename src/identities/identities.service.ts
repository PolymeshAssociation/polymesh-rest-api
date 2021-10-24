import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InviteAccountParams } from '@polymathnetwork/polymesh-sdk/internal';
import {
  ErrorCode,
  Identity,
  isPolymeshError,
  SecurityToken,
  SignerType,
} from '@polymathnetwork/polymesh-sdk/types';

import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { AccountSignerDto } from '~/identities/dto/account-signer.dto';
import { IdentitySignerDto } from '~/identities/dto/identity-signer.dto';
import { InviteAccountParamsDto } from '~/identities/dto/invite-account-params.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {
    this.logger.setContext(IdentitiesService.name);
  }

  /**
   * Method to get identity for a specific did
   */
  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    try {
      return await polymeshApi.getIdentity({ did });
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
   * Method to get trusting tokens for a specific did
   */
  public async findTrustingTokens(did: string): Promise<SecurityToken[]> {
    const identity = await this.findOne(did);
    return identity.getTrustingTokens();
  }

  public async inviteAccount(
    inviteAccountParamsDto: InviteAccountParamsDto
  ): Promise<QueueResult<void>> {
    try {
      const { signer, expiry, permissions, targetAccount } = inviteAccountParamsDto;
      const identity = await this.findOne(signer);
      const address = this.relayerAccountsService.findAddressByDid(signer);
      const params = {
        targetAccount:
          targetAccount.signerType === SignerType.Identity
            ? (targetAccount as IdentitySignerDto).did
            : {
                address: (targetAccount as AccountSignerDto).address,
              },
        permissions,
        expiry,
      } as InviteAccountParams;
      return processQueue(identity.inviteAccount, params, { signer: address });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (
          code === ErrorCode.ValidationError &&
          message.startsWith('The target Account already has a pending invitation')
        ) {
          throw new UnprocessableEntityException(
            'The target Account already has a pending invitation to join this Identity'
          );
        } else if (
          code === ErrorCode.ValidationError &&
          message.startsWith('The target Account is already part of an Identity')
        ) {
          throw new UnprocessableEntityException(
            'The target Account is already part of an Identity'
          );
        }
      }

      throw err;
    }
  }
}
