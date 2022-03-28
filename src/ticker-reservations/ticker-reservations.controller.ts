import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { SignerDto } from '~/common/dto/signer.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { TransferTickerOwnershipDto } from '~/ticker-reservations/dto/transfer-ticker-ownership.dto';
import { ExtendedTickerReservationModel } from '~/ticker-reservations/models/extended-ticker-reservation.model';
import { TickerReservationModel } from '~/ticker-reservations/models/ticker-reservation.model';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';
import { createTickerReservationModel } from '~/ticker-reservations/ticker-reservations.util';

@ApiTags('ticker-reservations')
@Controller('ticker-reservations/:ticker')
export class TickerReservationsController {
  constructor(private readonly tickerReservationsService: TickerReservationsService) {}

  @ApiOperation({
    summary: 'Reserve a Ticker',
    description: 'Reserves a ticker so that an Asset can be created with it later',
  })
  @ApiParam({
    name: 'ticker',
    description: 'Ticker to be reserved',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'The ticker has already been reserved',
  })
  @Post()
  public async reserve(
    @Param() { ticker }: TickerParamsDto,
    @Body() { signer }: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.tickerReservationsService.reserve(ticker, signer);
    return new TransactionQueueModel({ transactions });
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
  @ApiNotFoundResponse({
    description: 'The ticker has not been reserved',
  })
  @ApiGoneResponse({
    description: 'Asset has already been created',
  })
  @Get()
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
  @ApiCreatedResponse({
    description: 'Newly created Authorization Request along with transaction details',
    type: CreatedAuthorizationRequestModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Asset has already been created for the ticker',
  })
  @Post('/transfer-ownership')
  public async transferOwnership(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: TransferTickerOwnershipDto
  ): Promise<TransactionQueueModel> {
    const { transactions, result } = await this.tickerReservationsService.transferOwnership(
      ticker,
      params
    );
    return new CreatedAuthorizationRequestModel({
      transactions,
      authorizationRequest: createAuthorizationRequestModel(result),
    });
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
  @ApiCreatedResponse({
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
  @Post('/extend')
  public async extendReservation(
    @Param() { ticker }: TickerParamsDto,
    @Body() { signer }: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions, result } = await this.tickerReservationsService.extend(ticker, signer);
    return new ExtendedTickerReservationModel({
      transactions,
      tickerReservation: await createTickerReservationModel(result),
    });
  }
}
