import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Instruction, Venue } from '@polymeshassociation/polymesh-sdk/types';

import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { CreateVenueDto } from '~/settlements/dto/create-venue.dto';
import { ModifyVenueDto } from '~/settlements/dto/modify-venue.dto';
import { UpdateVenueSignersDto } from '~/settlements/dto/update-venue-signers.dto';
import { CreatedInstructionModel } from '~/settlements/models/created-instruction.model';
import { CreatedVenueModel } from '~/settlements/models/created-venue.model';
import { VenueDetailsModel } from '~/settlements/models/venue-details.model';
import { SettlementsService } from '~/settlements/settlements.service';
import { legsToLegModel } from '~/settlements/settlements.util';

@ApiTags('settlements', 'venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiOperation({
    summary: 'Fetch details of a Venue',
    description: 'This endpoint will provide the basic details of a Venue',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue whose details are to be fetched',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the Venue',
    type: VenueDetailsModel,
  })
  @Get('/:id')
  public async getVenueDetails(@Param() { id }: IdParamsDto): Promise<VenueDetailsModel> {
    const venueDetails = await this.settlementsService.findVenueDetails(id);
    return new VenueDetailsModel(venueDetails);
  }

  @ApiOperation({
    summary: 'Get all signers allowed by a Venue',
    description:
      'This endpoint will provide list of all signers allowed to sign off chain receipts for a specific Venue',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue for which signers are being fetched',
    type: 'string',
    example: '123',
  })
  @ApiArrayResponse('string', {
    description:
      'List of signers allowed to sign off chain receipts for instructions in the given Venue',
    paginated: false,
  })
  @Get('/:id/signers')
  public async getAllowedSigners(@Param() { id }: IdParamsDto): Promise<ResultsModel<string>> {
    const results = await this.settlementsService.fetchAllowedSigners(id);
    return new ResultsModel({
      results: results.map(({ address }) => address),
    });
  }

  @ApiOperation({
    summary: 'Create a Venue',
    description: 'This endpoint creates a new Venue',
  })
  @ApiTransactionResponse({
    description: 'Details about the newly created Venue',
    type: CreatedVenueModel,
  })
  @Post('/create')
  public async createVenue(
    @Body() createVenueDto: CreateVenueDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.createVenue(createVenueDto);

    const resolver: TransactionResolver<Venue> = ({ result: venue, transactions, details }) =>
      new CreatedVenueModel({
        venue,
        details,
        transactions,
      });

    return handleServiceResult(serviceResult, resolver);
  }

  @ApiOperation({
    summary: "Modify a venue's details",
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue whose details are to be modified',
    type: 'string',
    example: '123',
  })
  @Post('/:id/modify')
  public async modifyVenue(
    @Param() { id }: IdParamsDto,
    @Body() modifyVenueDto: ModifyVenueDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.modifyVenue(id, modifyVenueDto);
    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Add a list of signers allowed to sign receipts for a Venue',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue whose signer list is being modified',
    type: 'string',
    example: '123',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('/:id/add-signers')
  public async addVenueSigners(
    @Param() { id }: IdParamsDto,
    @Body() updateVenueSignersDto: UpdateVenueSignersDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.updateVenueSigners(
      id,
      updateVenueSignersDto,
      true
    );
    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Removes a list of signers from allowed list to sign receipts for a Venue',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue whose signer list is being modified',
    type: 'string',
    example: '123',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('/:id/remove-signers')
  public async removeVenueSigners(
    @Param() { id }: IdParamsDto,
    @Body() updateVenueSignersDto: UpdateVenueSignersDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.updateVenueSigners(
      id,
      updateVenueSignersDto,
      false
    );
    return handleServiceResult(serviceResult);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Create a new Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Venue through which Settlement will be handled',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'The ID of the newly created Instruction',
    type: CreatedInstructionModel,
  })
  @Post('/:id/instructions/create')
  public async createInstruction(
    @Param() { id }: IdParamsDto,
    @Body() createInstructionDto: CreateInstructionDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.createInstruction(id, createInstructionDto);

    const resolver: TransactionResolver<Instruction> = async ({
      result: instruction,
      transactions,
      details,
    }) => {
      const { data: legs } = await instruction.getLegsFromChain();

      return new CreatedInstructionModel({
        instruction,
        details,
        transactions,
        legs: legsToLegModel(legs),
      });
    };

    return handleServiceResult(serviceResult, resolver);
  }
}
