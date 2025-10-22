/* istanbul ignore file */

import { ClaimType, StatType } from '@polymeshassociation/polymesh-sdk/types';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountAffiliateStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';

@ValidatorConstraint({ name: 'isScopedCountStat', async: false })
class IsScopedCountStatConstraint implements ValidatorConstraintInterface {
  validate(value: unknown[]): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every(stat => {
      if (stat.type !== StatType.ScopedCount) {
        return true; // Not a ScopedCount stat, let other validators handle it
      }

      // For ScopedCount stats, validate based on claimType
      switch (stat.claimType) {
        case ClaimType.Accredited:
          return this.validateAccreditedStat(stat);
        case ClaimType.Affiliate:
          return this.validateAffiliateStat(stat);
        case ClaimType.Jurisdiction:
          return this.validateJurisdictionStat(stat);
        default:
          return false;
      }
    });
  }

  private validateAccreditedStat(stat: unknown): boolean {
    try {
      const dto = new AddClaimCountAccreditedStatDto();
      Object.assign(dto, stat);
      return true;
    } catch {
      return false;
    }
  }

  private validateAffiliateStat(stat: unknown): boolean {
    try {
      const dto = new AddClaimCountAffiliateStatDto();
      Object.assign(dto, stat);
      return true;
    } catch {
      return false;
    }
  }

  private validateJurisdictionStat(stat: unknown): boolean {
    try {
      const dto = new AddClaimCountJurisdictionStatDto();
      Object.assign(dto, stat);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Invalid ScopedCount statistics';
  }
}

export function IsScopedCountStat(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isScopedCountStat',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsScopedCountStatConstraint,
    });
  };
}
