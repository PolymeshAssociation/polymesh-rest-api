/* istanbul ignore file */

import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

/**
 * Shared swagger docs for the Portfolio Asset pre-approval transaction endpoints
 * (`preApproveAsset` / `removeAssetPreApproval`), which differ only in their
 * `id` param description and unprocessable entity message
 */
export function ApiPortfolioAssetPreApprovalResponses({
  idDescription,
  unprocessableEntityMessage,
}: {
  idDescription: string;
  unprocessableEntityMessage: string;
}): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiParam({
      name: 'did',
      description: 'The DID of the Portfolio owner',
      type: 'string',
      example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    }),
    ApiParam({
      name: 'id',
      description: idDescription,
      type: 'string',
      example: '1',
    }),
    ApiTransactionResponse({
      description: 'Information about the transaction',
      type: TransactionQueueModel,
    }),
    ApiTransactionFailedResponse({
      [HttpStatus.NOT_FOUND]: [
        'The Portfolio with provided ID was not found',
        'The Identity with provided DID was not found',
      ],
      [HttpStatus.UNPROCESSABLE_ENTITY]: [unprocessableEntityMessage],
    })
  );
}
