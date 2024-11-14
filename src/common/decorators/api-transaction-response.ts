/* istanbul ignore file */

import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponseOptions,
} from '@nestjs/swagger';

import { AppInternalError } from '~/common/errors';
import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { TransactionPayloadResultModel } from '~/common/models/transaction-payload-result.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

/**
 * A helper that functions like `ApiCreatedResponse`, that also adds an `ApiAccepted` response in case "submitWithCallback" is used and `ApiOKResponse` if "offline" mode is used
 *
 * @param options - these will be passed to the `ApiCreatedResponse` decorator
 */
export function ApiTransactionResponse(
  options: ApiResponseOptions
): ReturnType<typeof applyDecorators> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const optionType = (options as any).type;

  if (!optionType) {
    throw new AppInternalError(
      `ApiTransactionResponse requires "type". Received: ${JSON.stringify(options)}`
    );
  }

  const extendsQueueModel = optionType.prototype instanceof TransactionQueueModel;

  if (extendsQueueModel) {
    options.description += ` Note: if the signer is a MultiSigSigner, then only properties from "TransactionQueueModel" will be returned. The field "proposal" will be set and properties unique to "${optionType.name}" will be absent.`;
  }

  return applyDecorators(
    ApiOkResponse({
      description:
        'Returned if `"processMode": "offline"` is passed in `options`. A payload will be returned',
      type: TransactionPayloadResultModel,
    }),
    ApiCreatedResponse(options),
    ApiAcceptedResponse({
      description:
        'Returned if `"processMode": "submitWithCallback"` is passed in `options`. A response will be returned after the transaction has been validated. The result will be posted to the `webhookUrl` given when the transaction is completed',
      type: NotificationPayloadModel,
    })
  );
}
