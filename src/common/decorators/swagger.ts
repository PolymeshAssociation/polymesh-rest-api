/* istanbul ignore file */

import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptions,
  ApiResponseOptions,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { getTypeSafeObjectEntries } from '~/common/utils';

export const ApiArrayResponse = <TModel extends Type | string>(
  model: TModel,
  {
    paginated,
    example,
    examples,
    description,
  }: {
    paginated: boolean;
    example?: unknown;
    examples?: unknown[] | Record<string, unknown>;
    description?: string;
  } = {
    paginated: true,
  }
): ReturnType<typeof applyDecorators> => {
  const extraModels = [];
  let items;
  if (typeof model === 'string') {
    items = { type: model };
  } else {
    extraModels.push(model);
    items = { $ref: getSchemaPath(model) };
  }
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(paginated ? PaginatedResultsModel : ResultsModel) },
          {
            properties: {
              results: {
                type: 'array',
                items,
                example,
                examples,
                description,
              },
            },
          },
        ],
      },
    }),
    ApiExtraModels(PaginatedResultsModel, ResultsModel, ...extraModels)
  );
};

type ApiPropertyOneOfOptions = Omit<ApiPropertyOptions, 'oneOf' | 'type'> & {
  union: (Omit<SchemaObject, 'oneOf'> | Type)[];
};

/**
 * Create a property decorator with `oneOf` attribute whose value is set to the SchemaObject or ReferenceObject of the items of `union` parameter
 *
 * @note Non-schema objects in `union` must be defined as extra models using the `ApiExtraModels` decorator(at the class-level)
 */
export const ApiPropertyOneOf = ({
  union,
  ...apiPropertyOptions
}: ApiPropertyOneOfOptions): ReturnType<typeof applyDecorators> => {
  const oneOfItems: (SchemaObject | ReferenceObject)[] = [];

  union.forEach(item => {
    if (typeof item === 'object') {
      oneOfItems.push(item);
    } else {
      oneOfItems.push({ $ref: getSchemaPath(item) });
    }
  });

  return applyDecorators(ApiProperty({ ...apiPropertyOptions, oneOf: oneOfItems }));
};

/**
 * A helper that functions like `ApiCreatedResponse`, that also adds an `ApiAccepted` response in case `webhookUrl` is passed
 *
 * @param options - these will be passed to the `ApiCreatedResponse` decorator
 */
export function ApiTransactionResponse(
  options: ApiResponseOptions
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiCreatedResponse(options),
    ApiAcceptedResponse({
      description:
        'Returned if `webhookUrl` is passed in the body. A response will be returned after the transaction has been validated. The result will be posted to the `webhookUrl` given when the transaction is completed',
      type: NotificationPayloadModel,
    })
  );
}

const httpStatusDecoratorMap = {
  [HttpStatus.NOT_FOUND]: ApiNotFoundResponse,
  [HttpStatus.BAD_REQUEST]: ApiBadRequestResponse,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ApiUnprocessableEntityResponse,
};

type SupportedHttpStatusCodes = keyof typeof httpStatusDecoratorMap;

/**
 * A helper that combines responses for SDK Errors like `BadRequestException`, `NotFoundException`, `UnprocessableEntityException`
 *
 * @param messages - key value map of HTTP response code to their description that will be passed to appropriate `MethodDecorator`
 */
export function ApiTransactionFailedResponse(
  messages: Partial<Record<SupportedHttpStatusCodes, string>>
): ReturnType<typeof applyDecorators> {
  const decorators: MethodDecorator[] = [];

  getTypeSafeObjectEntries(messages).forEach(entry => {
    if (entry && entry[0]) {
      const [key, description] = entry;
      const decorator = httpStatusDecoratorMap[key];

      decorators.push(decorator({ description }));
    }
  });

  return applyDecorators(...decorators);
}
