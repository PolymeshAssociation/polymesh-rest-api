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
  OmitType,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionPayloadResultModel } from '~/common/models/transaction-payload-result.model';
import { Class } from '~/common/types';

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

export const ApiArrayResponseReplaceModelProperties = <T, K extends keyof T>(
  Model: Type<T>,
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
  },
  extendItems: Record<K, Type | string>
): ReturnType<typeof applyDecorators> => {
  const extraModels = [];
  const items: SchemaObject = {};
  const keys = Object.keys(extendItems) as K[];

  const obj = new Model() as unknown as Type;
  const name = `${obj.constructor.name}-Omit-${keys.join('-')}`;

  const intermediary = {
    [name]: class extends OmitType(
      Model as unknown as Class,
      keys as unknown as readonly never[]
    ) {},
  };

  items.allOf = [{ $ref: getSchemaPath(intermediary[name]) }];
  extraModels.push(intermediary[name]);

  for (const [key, value] of Object.entries(extendItems)) {
    if (typeof value === 'function') {
      extraModels.push(value);
      items.allOf.push({
        type: 'object',
        properties: {
          [key]: { $ref: getSchemaPath(value) },
        },
      });
    }

    if (typeof value === 'string') {
      items.allOf.push({
        type: 'object',
        properties: {
          [key]: { type: value },
        },
      });
    }
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
 * A helper that functions like `ApiCreatedResponse`, that also adds an `ApiAccepted` response in case "submitWithCallback" is used and `ApiOKResponse` if "offline" mode is used
 *
 * @param options - these will be passed to the `ApiCreatedResponse` decorator
 */
export function ApiTransactionResponse(
  options: ApiResponseOptions
): ReturnType<typeof applyDecorators> {
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

type SupportedHttpStatusCodes =
  | HttpStatus.NOT_FOUND
  | HttpStatus.BAD_REQUEST
  | HttpStatus.UNPROCESSABLE_ENTITY;

/**
 * A helper that combines responses for SDK Errors like `BadRequestException`, `NotFoundException`, `UnprocessableEntityException`
 *
 * @param messages - key value map of HTTP response code to their description that will be passed to appropriate `MethodDecorator`
 */
export function ApiTransactionFailedResponse(
  messages: Partial<Record<SupportedHttpStatusCodes, string[]>>
): ReturnType<typeof applyDecorators> {
  const decorators: MethodDecorator[] = [];

  Object.entries(messages).forEach(([statusCode, rawDescription]) => {
    const description =
      rawDescription.length > 1
        ? `<ul><li>${rawDescription.join('</li> <li>')}</li></ul>`
        : rawDescription[0];

    switch (Number(statusCode)) {
      case HttpStatus.NOT_FOUND:
        decorators.push(ApiNotFoundResponse({ description }));
        break;
      case HttpStatus.BAD_REQUEST:
        decorators.push(ApiBadRequestResponse({ description }));
        break;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        decorators.push(ApiUnprocessableEntityResponse({ description }));
        break;
    }
  });

  return applyDecorators(...decorators);
}
