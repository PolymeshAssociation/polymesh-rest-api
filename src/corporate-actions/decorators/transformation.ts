/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { plainToClass, Transform } from 'class-transformer';

import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';

type CaCheckpoint = string | { type: string; id: BigNumber };

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
