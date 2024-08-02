import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MetadataEntry, MetadataType } from '@polymeshassociation/polymesh-sdk/types';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import {
  ApiArrayResponse,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators/';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { CreateMetadataDto } from '~/metadata/dto/create-metadata.dto';
import { MetadataParamsDto } from '~/metadata/dto/metadata-params.dto';
import { SetMetadataDto } from '~/metadata/dto/set-metadata.dto';
import { MetadataService } from '~/metadata/metadata.service';
import { createMetadataDetailsModel } from '~/metadata/metadata.util';
import { CreatedMetadataEntryModel } from '~/metadata/models/created-metadata-entry.model';
import { MetadataDetailsModel } from '~/metadata/models/metadata-details.model';
import { MetadataEntryModel } from '~/metadata/models/metadata-entry.model';

@ApiTags('asset', 'metadata')
@Controller('assets/:ticker/metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @ApiOperation({
    summary: "Fetch an Asset's Metadata",
    description: 'This endpoint retrieves all the Metadata entries for a given Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose metadata are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(MetadataEntryModel, {
    description: 'List of Metadata entries distinguished by id, type and ticker',
    paginated: false,
  })
  @Get()
  public async getMetadata(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<MetadataEntryModel>> {
    const result = await this.metadataService.findAll(ticker);

    return new ResultsModel({
      results: result.map(
        ({ asset: { ticker: asset }, id, type }) => new MetadataEntryModel({ asset, id, type })
      ),
    });
  }

  @ApiOperation({
    summary: 'Fetch a specific Metadata entry for any Asset',
    description:
      'This endpoint retrieves the details of an Asset Metadata entry by its type and ID',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose metadata is to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'type',
    description: 'The type of Asset Metadata to be filtered',
    enum: MetadataType,
    example: MetadataType.Local,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of Asset Metadata to be filtered',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Details of an Asset Metadata including name, specs and value',
    type: MetadataDetailsModel,
  })
  @ApiNotFoundResponse({
    description: 'Asset Metadata does not exists',
  })
  @Get(':type/:id')
  public async getSingleMetadata(
    @Param() params: MetadataParamsDto
  ): Promise<MetadataDetailsModel> {
    const metadataEntry = await this.metadataService.findOne(params);

    return createMetadataDetailsModel(metadataEntry);
  }

  @ApiOperation({
    summary: 'Create a local metadata for an Asset and optionally set its value.',
    description:
      'This endpoint creates a local metadata for the given Asset. The metadata value can be set by passing `value` parameter and specifying other optional `details` about the value',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the metadata is to be created',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'The newly created Metadata entry along with transaction details',
    type: CreatedMetadataEntryModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found'],
    [HttpStatus.BAD_REQUEST]: [
      'Asset Metadata name length exceeded',
      'Asset Metadata value length exceeded',
    ],
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'Asset Metadata with the given name already exists',
      'Locked until date of the Metadata value must be in the future',
      'Expiry date for the Metadata value must be in the future',
    ],
  })
  @Post('create')
  public async createMetadata(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: CreateMetadataDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.metadataService.create(ticker, params);

    const resolver: TransactionResolver<MetadataEntry> = ({ details, transactions, result }) => {
      const {
        asset: { ticker: assetTicker },
        id,
        type,
      } = result;
      return new CreatedMetadataEntryModel({
        details,
        transactions,
        metadata: new MetadataEntryModel({ asset: assetTicker, id, type }),
      });
    };

    return handleServiceResult(serviceResult, resolver);
  }

  @ApiOperation({
    summary: "Set an Asset's Metadata value and details",
    description:
      'This endpoint assigns a new value for the Metadata along with its expiry and lock status (when provided with `details`) of the Metadata value. Note that the value of a locked Metadata cannot be altered',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Metadata value is to be set',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'type',
    description: 'The type of Asset Metadata',
    enum: MetadataType,
    example: MetadataType.Local,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of Asset Metadata',
    type: 'string',
    example: '1',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found', 'Asset Metadata does not exists'],
    [HttpStatus.BAD_REQUEST]: ['Asset Metadata name length exceeded'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'Details cannot be set for a locked Metadata value',
      'Metadata value is currently locked',
      'Details cannot be set for a metadata without a value',
    ],
  })
  @Post(':type/:id/set')
  public async setMetadata(
    @Param() params: MetadataParamsDto,
    @Body() body: SetMetadataDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.metadataService.setValue(params, body);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: "Remove an Asset's Metadata value",
    description:
      "This endpoint removes the existing value of the Asset's Metadata. Note that value for a metadata can only be remove only if it is not locked.",
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Metadata value is to be removed',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'type',
    description: 'The type of Asset Metadata',
    enum: MetadataType,
    example: MetadataType.Local,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of Asset Metadata',
    type: 'string',
    example: '1',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found', 'Asset Metadata does not exists'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Metadata is locked and cannot be modified'],
  })
  @Post(':type/:id/clear')
  public async clearMetadata(
    @Param() params: MetadataParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.metadataService.clearValue(params, transactionBaseDto);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Remove a local Asset Metadata',
    description:
      'This endpoint removes a local Asset Metadata key. Note, a local metadata key can only be removed if it is not locked',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Metadata is to be removed',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'type',
    description: 'The type of Asset Metadata',
    enum: MetadataType.Local,
    example: MetadataType.Local,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of Asset Metadata',
    type: 'string',
    example: '1',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Asset was not found', 'Asset Metadata does not exists'],
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Metadata is locked and cannot be modified'],
  })
  @Post(':type/:id/remove')
  public async removeLocalMetadata(
    @Param() params: MetadataParamsDto,
    @Body() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.metadataService.removeKey(params, transactionBaseDto);

    return handleServiceResult(serviceResult);
  }
}
