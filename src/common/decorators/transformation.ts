/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity, PortfolioLike, Venue } from '@polymathnetwork/polymesh-sdk/types';
import { Transform } from 'class-transformer';

import { PortfolioDto } from '~/common/dto/portfolio.dto';

/**
 * String -> BigNumber
 */
export function ToBigNumber() {
  return applyDecorators(Transform(({ value }: { value: string }) => new BigNumber(value)));
}

/**
 * PortfolioDto -> PortfolioLike
 */
export function ToPortfolioLike() {
  return applyDecorators(
    Transform(
      ({ value: { did, id } }: { value: PortfolioDto }): PortfolioLike => {
        if (id) {
          return {
            identity: did,
            id: new BigNumber(id),
          };
        }
        return did;
      }
    )
  );
}

/**
 * Venue -> string
 */
export function FromVenue() {
  return applyDecorators(Transform(({ value: { id } }: { value: Venue }) => id.toString()));
}

/**
 * Identity -> string
 */
export function FromIdentity() {
  return applyDecorators(Transform(({ value: { did } }: { value: Identity }) => did));
}

/**
 * BigNumber -> string
 */
export function FromBigNumber() {
  return applyDecorators(Transform(({ value }: { value: BigNumber }) => value.toString()));
}
