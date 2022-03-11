import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AuthorizationRequest,
  ErrorCode,
  TickerReservation,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { processQueue, QueueResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { TransferTickerOwnershipDto } from '~/ticker-reservations/dto/transfer-ticker-ownership.dto';

@Injectable()
export class TickerReservationsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findOne(ticker: string): Promise<TickerReservation> {
    try {
      return await this.polymeshService.polymeshApi.assets.getTickerReservation({
        ticker,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (
          code === ErrorCode.UnmetPrerequisite &&
          message.startsWith('There is no reservation for')
        ) {
          throw new NotFoundException(`There is no reservation for "${ticker}"`);
        } else if (
          code === ErrorCode.UnmetPrerequisite &&
          message.endsWith('Asset has been created')
        ) {
          throw new GoneException(`Asset ${ticker} has already been created`);
        }
      }

      throw err;
    }
  }

  public async reserve(ticker: string, signer: string): Promise<QueueResult<TickerReservation>> {
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const reserveTicker = this.polymeshService.polymeshApi.assets.reserveTicker;
    return processQueue(reserveTicker, { ticker }, { signer: address });
  }

  public async transferOwnership(
    ticker: string,
    params: TransferTickerOwnershipDto
  ): Promise<QueueResult<AuthorizationRequest>> {
    const { signer, ...rest } = params;
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const { transferOwnership } = await this.findOne(ticker);
    return processQueue(transferOwnership, rest, { signer: address });
  }

  public async extend(ticker: string, signer: string): Promise<QueueResult<TickerReservation>> {
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const { extend } = await this.findOne(ticker);
    return processQueue(extend, {}, { signer: address });
  }

  public async findAllByOwner(owner: string): Promise<TickerReservation[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.assets.getTickerReservations({ owner });
  }
}
