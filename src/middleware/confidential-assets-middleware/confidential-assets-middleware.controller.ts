import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { ConfidentialAssetIdParamsDto } from '~/confidential-assets/dto/confidential-asset-id-params.dto';

@Controller()
export class ConfidentialAssetsMiddlewareController {
  constructor(private readonly confidentialAssetsService: ConfidentialAssetsService) {}

  @ApiOperation({
    summary: 'Get creation event data for a Confidential Asset',
    description:
      'This endpoint will provide the basic details of an Confidential Asset along with the auditors information',
  })
  @ApiParam({
    name: 'confidentialAssetId',
    description: 'The ID of the Confidential Asset',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiOkResponse({
    description: 'Details of event where the Confidential Asset was created',
    type: EventIdentifierModel,
  })
  @ApiNotFoundResponse({
    description: 'Data is not yet processed by the middleware',
  })
  @Get('confidential-assets/:confidentialAssetId/created-at')
  public async createdAt(
    @Param() { confidentialAssetId }: ConfidentialAssetIdParamsDto
  ): Promise<EventIdentifierModel> {
    const result = await this.confidentialAssetsService.createdAt(confidentialAssetId);

    if (!result) {
      throw new NotFoundException(
        "Confidential Asset's data hasn't yet been processed by the middleware"
      );
    }

    return new EventIdentifierModel(result);
  }
}
