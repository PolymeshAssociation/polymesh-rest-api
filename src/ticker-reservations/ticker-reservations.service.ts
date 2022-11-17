import { Injectable } from '@nestjs/common';
import { AuthorizationRequest, TickerReservation } from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class TickerReservationsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findOne(ticker: string): Promise<TickerReservation> {
    return this.polymeshService.polymeshApi.assets.getTickerReservation({
      ticker,
    });
  }

  public async reserve(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<TickerReservation> {
    const { transactionsService, polymeshService } = this;
    const { reserveTicker } = polymeshService.polymeshApi.assets;

    return transactionsService.submit(reserveTicker, { ticker }, transactionBaseDto);
  }

  public async transferOwnership(
    ticker: string,
    params: TransferOwnershipDto
  ): ServiceReturn<AuthorizationRequest> {
    const { signer, webhookUrl, dryRun, ...rest } = params;
    const { transferOwnership } = await this.findOne(ticker);
    return this.transactionsService.submit(transferOwnership, rest, { signer, webhookUrl, dryRun });
  }

  public async extend(
    ticker: string,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<TickerReservation> {
    const { extend } = await this.findOne(ticker);

    return this.transactionsService.submit(extend, {}, transactionBaseDto);
  }

  public async findAllByOwner(owner: string): Promise<TickerReservation[]> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.assets.getTickerReservations({ owner });
  }
}
