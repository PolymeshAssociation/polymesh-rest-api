/* istanbul ignore file */

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
) => {
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApiPropertyOneOf = ({ union, ...apiPropertyOptions }: ApiPropertyOneOfOptions) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const extraModels: Function[] = [];
  const oneOfItems: (SchemaObject | ReferenceObject)[] = [];
  union.forEach(item => {
    if (typeof item === 'object') {
      oneOfItems.push(item);
    } else {
      oneOfItems.push({ $ref: getSchemaPath(item) });
      extraModels.push(item);
    }
  });

  return applyDecorators(ApiProperty({ ...apiPropertyOptions, oneOf: oneOfItems }));
};
