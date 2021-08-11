import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { IdParams } from '~/common/dto/id-params.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { PortfolioTransferDto } from '~/portfolios/dto/portfolio-transfer.dto';
import { PortfoliosService } from '~/portfolios/portfolios.service';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @ApiOperation({
    summary: 'Move Assets',
    description: 'Transfers Assets between Portfolios',
  })
  @ApiParam({
    name: 'id',
    description: 'The Portfolio ID to transfer Assets from. 0 for default Portfolio',
    type: 'string',
    example: '3',
  })
  @ApiCreatedResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @Post(':id/transfers')
  public async moveAssets(
    @Param() { id }: IdParams,
    @Body() transferParams: PortfolioTransferDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.portfoliosService.moveAssets(id, transferParams);
    return new TransactionQueueModel({ transactions });
  }
}
