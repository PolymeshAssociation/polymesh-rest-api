/* istanbul ignore file */

import { applyDecorators } from '@nestjs/common';
import { DistributionWithDetails, DividendDistribution } from '@polymathnetwork/polymesh-sdk/types';
import { plainToClass, Transform } from 'class-transformer';
import { registerDecorator, validate as validateClass, ValidationArguments } from 'class-validator';

import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';
import { DividendDistributionDetailsModel } from '~/corporate-actions/model/dividend-distribution-details.model';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export function createDividendDistributionModel(
  distribution: DividendDistribution
): DividendDistributionModel {
  const {
    origin,
    currency,
    perShare,
    maxAmount,
    expiryDate,
    paymentDate,
    id,
    token: { ticker },
    declarationDate,
    description,
    targets,
    defaultTaxWithholding,
    taxWithholdings,
  } = distribution;
  return new DividendDistributionModel({
    origin: createPortfolioIdentifierModel(origin),
    currency,
    perShare,
    maxAmount,
    expiryDate,
    paymentDate,
    id,
    ticker,
    declarationDate,
    description,
    targets,
    defaultTaxWithholding,
    taxWithholdings,
  });
}

export function createDividendDistributionDetailsModel(
  distributionWithDetails: DistributionWithDetails
): DividendDistributionDetailsModel {
  const { distribution, details } = distributionWithDetails;

  return new DividendDistributionDetailsModel({
    distribution: createDividendDistributionModel(distribution),
    ...details,
  });
}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export function ToCaCheckpoint() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (typeof value === 'string') {
        return new Date(value);
      } else {
        return plainToClass(CorporateActionCheckpointDto, value);
      }
    })
  );
}

export function IsCaCheckpoint() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCaCheckpoint',
      target: object.constructor,
      propertyName,
      validator: {
        async validate(value: unknown) {
          if (value instanceof Date) {
            return !isNaN(new Date(value).getTime());
          }
          if (value instanceof CorporateActionCheckpointDto) {
            return (await validateClass(value)).length === 0;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'`;
        },
      },
    });
  };
}
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */
