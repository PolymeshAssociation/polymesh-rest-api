import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Instruction } from '@polymeshassociation/polymesh-sdk/types';

import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { AffirmAsMediatorDto } from '~/settlements/dto/affirm-as-mediator.dto';
import { AffirmInstructionDto } from '~/settlements/dto/affirm-instruction.dto';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { ExecuteInstructionDto } from '~/settlements/dto/execute-instruction.dto';
import { LegIdParamsDto } from '~/settlements/dto/leg-id-params.dto';
import { LegValidationParamsDto } from '~/settlements/dto/leg-validation-params.dto';
import { CreatedInstructionModel } from '~/settlements/models/created-instruction.model';
import { InstructionModel } from '~/settlements/models/instruction.model';
import { InstructionAffirmationModel } from '~/settlements/models/instruction-affirmation.model';
import { OffChainAffirmationModel } from '~/settlements/models/off-chain-affirmation.model';
import { TransferBreakdownModel } from '~/settlements/models/transfer-breakdown.model';
import { SettlementsService } from '~/settlements/settlements.service';
import { createInstructionModel, legsToLegModel } from '~/settlements/settlements.util';

@ApiTags('settlements')
@Controller()
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Fetch Instruction details',
    description: 'This endpoint will provide the details of the Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the Instruction',
    type: InstructionModel,
  })
  @ApiNotFoundResponse({
    description: 'The Instruction with the given ID was not found',
  })
  @Get('instructions/:id')
  public async getInstruction(@Param() { id }: IdParamsDto): Promise<InstructionModel> {
    const instruction = await this.settlementsService.findInstruction(id);
    return createInstructionModel(instruction);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Affirm an existing Instruction',
    description:
      'This endpoint will affirm a pending Instruction. All owners of involved portfolios must affirm for the Instruction to be executed',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction to be affirmed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('instructions/:id/affirm')
  public async affirmInstruction(
    @Param() { id }: IdParamsDto,
    @Body() affirmInstructionDto: AffirmInstructionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.affirmInstruction(id, affirmInstructionDto);
    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Reject an existing Instruction',
    description: 'This endpoint will reject a pending Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction to be rejected',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('instructions/:id/reject')
  public async rejectInstruction(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.rejectInstruction(id, signerDto);
    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Withdraw affirmation from an existing Instruction',
    description: 'This endpoint will withdraw an affirmation from an Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction from which to withdraw the affirmation',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The requested Instruction was not found',
  })
  @Post('instructions/:id/withdraw')
  public async withdrawAffirmation(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.withdrawAffirmation(id, signerDto);

    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Affirm an existing Instruction as a mediator',
    description: 'This endpoint will affirm a pending Instruction as a mediator',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction to be affirmed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('instructions/:id/affirm-as-mediator')
  public async affirmInstructionAsMediator(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: AffirmAsMediatorDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.affirmInstructionAsMediator(id, signerDto);
    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Reject an existing Instruction as a mediator',
    description: 'This endpoint will reject a pending Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction to be rejected',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('instructions/:id/reject-as-mediator')
  public async rejectInstructionAsMediator(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.rejectInstructionAsMediator(id, signerDto);
    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Withdraw affirmation from an existing Instruction as a mediator',
    description: 'This endpoint will withdraw an affirmation from an Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction from which to withdraw the affirmation',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The requested Instruction was not found',
  })
  @Post('instructions/:id/withdraw-as-mediator')
  public async withdrawAffirmationAsMediator(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.withdrawAffirmationAsMediator(id, signerDto);

    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'List of affirmations',
    description:
      'This endpoint will provide the list of all affirmations generated by a Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction whose affirmations are to be fetched',
    type: 'string',
    example: '123',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of affirmations to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start index from which affirmations are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiArrayResponse(InstructionAffirmationModel, {
    description: 'List of all affirmations related to the target Identity and their current status',
    paginated: true,
  })
  @Get('instructions/:id/affirmations')
  public async getAffirmations(
    @Param() { id }: IdParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<InstructionAffirmationModel>> {
    const { data, count, next } = await this.settlementsService.findAffirmations(
      id,
      size,
      start?.toString()
    );
    return new PaginatedResultsModel({
      results:
        data?.map(
          ({ identity, status }) =>
            new InstructionAffirmationModel({
              identity,
              status,
            })
        ) ?? [],
      total: count,
      next,
    });
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'List of affirmations for off chain legs',
    description:
      'This endpoint will provide the affirmation statuses for off chain legs in a Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction whose off chain affirmations are to be fetched',
    type: 'string',
    example: '123',
  })
  @ApiArrayResponse(OffChainAffirmationModel, {
    description: 'List of all off chain affirmations received',
    paginated: false,
  })
  @Get('instructions/:id/off-chain-affirmations')
  public async getOffChainAffirmations(
    @Param() { id }: IdParamsDto
  ): Promise<ResultsModel<OffChainAffirmationModel>> {
    const result = await this.settlementsService.fetchOffChainAffirmations(id);
    return new ResultsModel({
      results: result.map(
        ({ legId, status }) =>
          new OffChainAffirmationModel({
            legId,
            status,
          })
      ),
    });
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Get off-chain affirmation status for a specific leg',
    description:
      'This endpoint will provide the affirmation status of a specific off chain leg in an Instruction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction',
    type: 'string',
    example: '123',
  })
  @ApiParam({
    name: 'legId',
    description: 'The leg index for which the affirmation status is to be fetched',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Affirmation status of the specified leg in the Instruction provided',
    type: OffChainAffirmationModel,
  })
  @Get('instructions/:id/off-chain-affirmations/:legId')
  public async getOffChainAffirmationForLeg(
    @Param() { id, legId }: LegIdParamsDto
  ): Promise<OffChainAffirmationModel> {
    const status = await this.settlementsService.fetchOffChainAffirmationForALeg(id, legId);
    return new OffChainAffirmationModel({
      legId,
      status,
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Check if a Leg meets the transfer requirements',
    description: 'This endpoint will provide transfer breakdown of an Asset transfer',
  })
  @ApiOkResponse({
    description:
      'Breakdown of every requirement that must be fulfilled for an Asset transfer to be executed successfully, and whether said requirement is met or not',
    type: TransferBreakdownModel,
  })
  @Get('leg-validations')
  public async validateLeg(
    @Query()
    { asset, amount, nfts, fromDid, fromPortfolio, toDid, toPortfolio }: LegValidationParamsDto
  ): Promise<TransferBreakdownModel> {
    const fromPortfolioLike = new PortfolioDto({
      did: fromDid,
      id: fromPortfolio,
    }).toPortfolioLike();
    const toPortfolioLike = new PortfolioDto({ did: toDid, id: toPortfolio }).toPortfolioLike();

    const transferBreakdown = await this.settlementsService.canTransfer(
      fromPortfolioLike,
      toPortfolioLike,
      asset,
      amount,
      nfts
    );

    return new TransferBreakdownModel(transferBreakdown);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Execute an existing Instruction',
    description: 'This endpoint will execute a pending Instruction of type `SettleManual`',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Instruction to be executed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post('instructions/:id/execute-manually')
  public async executeInstruction(
    @Param() { id }: IdParamsDto,
    @Body() body: ExecuteInstructionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.settlementsService.executeInstruction(id, body);
    return handleServiceResult(result);
  }

  @ApiTags('instructions')
  @ApiOperation({
    summary: 'Create a new Instruction',
  })
  @ApiOkResponse({
    description: 'The ID of the newly created Instruction',
    type: CreatedInstructionModel,
  })
  @Post('instructions/create')
  public async addInstruction(
    @Body() createInstructionDto: CreateInstructionDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.settlementsService.createInstruction(
      undefined,
      createInstructionDto
    );

    const resolver: TransactionResolver<Instruction> = async ({
      result: instruction,
      transactions,
      details,
    }) => {
      const { data: legs } = await instruction.getLegs();

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
