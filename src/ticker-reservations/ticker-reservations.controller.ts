import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthorizationRequest, TickerReservation } from '@polymeshassociation/polymesh-sdk/types';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransferOwnershipDto } from '~/common/dto/transfer-ownership.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handlePayload, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { ReserveTickerDto } from '~/ticker-reservations/dto/reserve-ticker.dto';
import { ExtendedTickerReservationModel } from '~/ticker-reservations/models/extended-ticker-reservation.model';
import { TickerReservationModel } from '~/ticker-reservations/models/ticker-reservation.model';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';
import { createTickerReservationModel } from '~/ticker-reservations/ticker-reservations.util';

@ApiTags('ticker-reservations')
@Controller('ticker-reservations')
export class TickerReservationsController {
  constructor(private readonly tickerReservationsService: TickerReservationsService) {}

  @ApiOperation({
    summary: 'Reserve a Ticker',
    description: 'Reserves a ticker so that an Asset can be created with it later',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'The ticker has already been reserved',
  })
  @Post('reserve-ticker')
  public async reserve(
    @Body() { ticker, signer, webhookUrl }: ReserveTickerDto
  ): Promise<TransactionResponseModel> {
    const result = await this.tickerReservationsService.reserve(ticker, signer, webhookUrl);

    return handlePayload(result);
  }

  @ApiOperation({
    summary: 'Get ticker reservation details',
    description: 'This endpoint returns details of ticker reservation',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Ticker whose details are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Details of the ticker reservation',
    type: TickerReservationModel,
  })
  @Get(':ticker')
  public async getDetails(@Param() { ticker }: TickerParamsDto): Promise<TickerReservationModel> {
    const tickerReservation = await this.tickerReservationsService.findOne(ticker);
    return createTickerReservationModel(tickerReservation);
  }

  @ApiOperation({
    summary: 'Transfer ownership of the ticker Reservation',
    description:
      'This endpoint transfers ownership of the ticker Reservation to `target` Identity. This generates an authorization request that must be accepted by the `target` Identity',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Ticker whose ownership is to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Asset has already been created for the ticker',
  })
  @Post(':ticker/transfer-ownership')
  public async transferOwnership(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: TransferOwnershipDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.tickerReservationsService.transferOwnership(ticker, params);

    const resolver: TransactionResolver<AuthorizationRequest> = ({ transactions, result }) =>
      new CreatedAuthorizationRequestModel({
        transactions,
        authorizationRequest: createAuthorizationRequestModel(result),
      });

    return handlePayload(serviceResult, resolver);
  }

  @ApiOperation({
    summary: 'Extend ticker reservation',
    description:
      'This endpoint extends the time period of a ticker reservation for 60 days from now',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Ticker whose expiry date is to be extended',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details of extended ticker reservation along with transaction details',
    type: ExtendedTickerReservationModel,
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      '<li>Asset has already been created for the ticker</li>' +
      '<li>Ticker not reserved or the Reservation has expired</li>' +
      '</ul>',
  })
  @Post(':ticker/extend')
  public async extendReservation(
    @Param() { ticker }: TickerParamsDto,
    @Body() { signer, webhookUrl }: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.tickerReservationsService.extend(ticker, signer, webhookUrl);

    const resolver: TransactionResolver<TickerReservation> = async ({ transactions, result }) =>
      new ExtendedTickerReservationModel({
        transactions,
        tickerReservation: await createTickerReservationModel(result),
      });

    return handlePayload(serviceResult, resolver);
  }
}
