import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRulesDto } from '~/compliance/dto/set-rules.dto';

@ApiTags('compliance')
@Controller('/assets/:ticker/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Sets compliance rules for an Asset',
    description:
      'This endpoint sets compliance rules for an Asset. This method will replace the current rules',
  })
  @ApiCreatedResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Put('/')
  public async setRules(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SetRulesDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.complianceService.setRules(ticker, params);
    return new TransactionQueueModel({ transactions });
  }
}
