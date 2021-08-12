import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DidDto } from '~/common/dto/params.dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { PortfolioTransferDto } from '~/portfolios/dto/portfolio-transfer.dto';
import { PortfoliosService } from '~/portfolios/portfolios.service';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @ApiOperation({
    summary: 'Move Assets between portfolios',
    description: 'This endpoint transfers Assets between Portfolios',
  })
  @ApiParam({
    name: 'did',
    description: 'The DID of the owner of the Portfolios to transfer assets between.',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiCreatedResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @Post('/identities/:did/portfolio-asset-transfers')
  public async moveAssets(
    @Param() { did }: DidDto,
    @Body() transferParams: PortfolioTransferDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.portfoliosService.moveAssets(did, transferParams);
    return new TransactionQueueModel({ transactions });
  }
}
