import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { PaginatedResultsDto } from '~/common/dto/paginated-results.dto';
import { ResultsDto } from '~/common/dto/results.dto';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApiArrayResponse = <TModel extends Type | string>(
  model: TModel,
  {
    paginated,
    example,
    examples,
  }: { paginated: boolean; example?: unknown; examples?: unknown[] | Record<string, unknown> } = {
    paginated: true,
  }
) => {
  const extraModels = [];
  let items;
  if (typeof model === 'string') {
    items = { type: model, example, examples };
  } else {
    extraModels.push(model);
    items = { $ref: getSchemaPath(model) };
  }
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(paginated ? PaginatedResultsDto : ResultsDto) },
          {
            properties: {
              results: {
                type: 'array',
                items,
              },
            },
          },
        ],
      },
    }),
    ApiExtraModels(PaginatedResultsDto, ResultsDto)
  );
};
