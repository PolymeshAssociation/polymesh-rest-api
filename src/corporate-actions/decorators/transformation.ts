/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { plainToClass, Transform } from 'class-transformer';

import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';

type CaCheckpoint = string | { type: string; id: number };

/**
 * String | { type: string; id: string; } -> CorporateActionCheckpointDto | Date
 */
export function ToCaCheckpoint() {
  return applyDecorators(
    Transform(({ value }: { value: CaCheckpoint }) => {
      if (typeof value === 'string') {
        return new Date(value);
      } else {
        return plainToClass(CorporateActionCheckpointDto, value);
      }
    })
  );
}
