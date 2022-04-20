/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Transform } from 'class-transformer';

/**
 * Transforms a null value default Portfolio id to 0
 */
export function FromPortfolioId() {
  return applyDecorators(
    Transform(({ value }: { value?: BigNumber | string }) => (value || new BigNumber(0)).toString())
  );
}
