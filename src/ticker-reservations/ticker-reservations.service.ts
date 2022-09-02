import { Injectable } from '@nestjs/common';
import { AuthorizationRequest, TickerReservation } from '@polymeshassociation/polymesh-sdk/types';

import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { processTransaction, TransactionResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class TickerReservationsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly signingService: SigningService
  ) {}

  public async findOne(ticker: string): Promise<TickerReservation> {
    return this.polymeshService.polymeshApi.assets.getTickerReservation({
      ticker,
    });
  }

  public async reserve(
    ticker: string,
    signer: string
  ): Promise<TransactionResult<TickerReservation>> {
    const { signingService, polymeshService } = this;
    const address = await signingService.getAddressByHandle(signer);
    const { reserveTicker } = polymeshService.polymeshApi.assets;
    return processTransaction(reserveTicker, { ticker }, { signingAccount: address });
  }

  public async transferOwnership(
    ticker: string,
    params: TransferOwnershipDto
  ): Promise<TransactionResult<AuthorizationRequest>> {
    const { signer, ...rest } = params;
    const address = await this.signingService.getAddressByHandle(signer);
    const { transferOwnership } = await this.findOne(ticker);
    return processTransaction(transferOwnership, rest, { signingAccount: address });
  }

  public async extend(
    ticker: string,
    signer: string
  ): Promise<TransactionResult<TickerReservation>> {
    const address = await this.signingService.getAddressByHandle(signer);
    const { extend } = await this.findOne(ticker);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processTransaction(extend, { signingAccount: address }, {});
  }

  public async findAllByOwner(owner: string): Promise<TickerReservation[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.assets.getTickerReservations({ owner });
  }
}
