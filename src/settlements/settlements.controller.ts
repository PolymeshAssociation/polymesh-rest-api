import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { InstructionStatusResult, isPolymeshError } from '@polymathnetwork/polymesh-sdk/types';
import { IsNumberString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';
import { TransactionQueueDto } from '~/common/dto/transaction-queue.dto';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { InstructionIdDto } from '~/settlements/dto/instruction-id.dto';
import { InstructionStatusDto } from '~/settlements/dto/instruction-status.dto';
import { SettlementsService } from '~/settlements/settlements.service';

class IdParams {
  @IsNumberString()
  readonly id: string;
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
  @Get('instructions/:id')
  public async getInstruction(@Param() { id }: IdParams): Promise<InstructionStatusDto> {
    let status: InstructionStatusResult;
    try {
      status = await this.settlementsService.getInstruction(id);
    } catch (err) {
      if (isPolymeshError(err)) {
        const { message } = err;

        if (message.startsWith("The Instruction doesn't")) {
          throw new NotFoundException(`There is no Instruction with ID ${id}`);
        }
      }

      throw err;
    }

    return new InstructionStatusDto(status);
  }

  @ApiTags('instructions')
  @ApiTags('venues')
  @ApiParam({
    type: 'string',
    name: 'id',
  })
  @Post('venues/:id/instructions')
  public async createInstruction(
    @Param() { id }: IdParams,
    @Body() createInstructionDto: CreateInstructionDto
  ): Promise<InstructionIdDto> {
    const {
      result: { id: instructionId },
      transactions,
    } = await this.settlementsService.createInstruction(id, createInstructionDto);

    return {
      instructionId,
      transactions,
    };
  }

  @ApiTags('instructions')
  @ApiParam({
    type: 'string',
    name: 'id',
  })
  @Post('instructions/:id/affirm')
  public async affirmInstruction(
    @Param() { id }: IdParams,
    @Body() signerDto: SignerDto
  ): Promise<TransactionQueueDto> {
    const { transactions } = await this.settlementsService.affirmInstruction(id, signerDto);

    return { transactions };
  }
}
