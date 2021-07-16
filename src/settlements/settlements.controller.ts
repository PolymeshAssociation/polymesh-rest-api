import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { TransactionQueueDto } from '~/common/dto/transaction-queue.dto';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { InstructionIdDto } from '~/settlements/dto/instruction-id.dto';
import { InstructionStatusDto } from '~/settlements/dto/instruction-status.dto';
import { SettlementsService } from '~/settlements/settlements.service';

class IdParams {
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;
}

@ApiTags('settlements')
@Controller({})
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiTags('instructions')
  @ApiParam({
    type: 'string',
    name: 'id',
  })
  @ApiOperation({
    summary: "Fetch an instruction's status",
  })
  @Get('instructions/:id')
  public async getInstruction(@Param() { id }: IdParams): Promise<InstructionStatusDto> {
    const status = await this.settlementsService.findInstruction(id);

    return new InstructionStatusDto(status);
  }

  @ApiTags('instructions')
  @ApiTags('venues')
  @ApiParam({
    type: 'string',
    name: 'id',
  })
  @ApiOperation({
    summary: 'Create a new instruction',
  })
  @Post('venues/:id/instructions')
  public async createInstruction(
    @Param() { id }: IdParams,
    @Body() createInstructionDto: CreateInstructionDto
  ): Promise<InstructionIdDto> {
    const { result: instructionId, transactions } = await this.settlementsService.createInstruction(
      id,
      createInstructionDto
    );

    return new InstructionIdDto({
      instructionId,
      transactions,
    });
  }

  @ApiTags('instructions')
  @ApiParam({
    type: 'string',
    name: 'id',
  })
  @ApiOperation({
    summary:
      'Affirm an existing instruction. All owners of involved portfolios must affirm for the instruction to be executed',
  })
  @Post('instructions/:id/affirm')
  public async affirmInstruction(
    @Param() { id }: IdParams,
    @Body() signerDto: SignerDto
  ): Promise<TransactionQueueDto> {
    const { transactions } = await this.settlementsService.affirmInstruction(id, signerDto);

    return new TransactionQueueDto({ transactions });
  }
}
