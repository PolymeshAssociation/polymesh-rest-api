/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, StatType } from '@polymeshassociation/polymesh-sdk/types';
import { plainToInstance, Transform } from 'class-transformer';

import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountAffiliateStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';
import { AddClaimPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-percentage-stat.dto';
import { AddCountStatDto } from '~/assets/dto/transfer-restrictions/stats/add-count-stat.dto';
import { AddPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-percentage-stat.dto';
import { ClaimCountAccreditedValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-accredited-value.dto';
import { ClaimCountAffiliateValueDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-affiliate-value.dto';
import { ClaimCountJurisdictionValueItemDto } from '~/assets/dto/transfer-restrictions/stats/claim-count-jurisdiction-value-item.dto';

/**
 * Custom transformer for ScopedCount statistics that discriminates based on claimType
 *
 * IMPORTANT: This transformer ensures instances are converted to plain objects to preserve
 * properties during destructuring in extractTxOptions
 */
export function TransformScopedCountStats(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown[] }) => {
      if (!Array.isArray(value)) {
        return value;
      }

      return value.map(stat => {
        if (typeof stat !== 'object' || stat === null) {
          return stat;
        }

        // Check if it's already a class instance
        const isInstance =
          stat instanceof AddCountStatDto ||
          stat instanceof AddPercentageStatDto ||
          stat instanceof AddClaimPercentageStatDto ||
          stat instanceof AddClaimCountAccreditedStatDto ||
          stat instanceof AddClaimCountAffiliateStatDto ||
          stat instanceof AddClaimCountJurisdictionStatDto;

        // If it's a plain object, manually apply BigNumber transformations
        // then convert to class instance for validation, then back to plain for extractTxOptions
        if (!isInstance && (stat.constructor === Object || stat.constructor === undefined)) {
          const statObj = stat as {
            type?: StatType;
            claimType?: ClaimType;
            count?: string | BigNumber;
            value?: unknown;
          };

          // Create transformed stat object with BigNumber conversions
          const transformed: Record<string, unknown> = { ...stat };

          switch (statObj.type) {
            case StatType.Count: {
              // Convert count to BigNumber
              if (typeof statObj.count === 'string') {
                transformed.count = new BigNumber(statObj.count);
              } else if (statObj.count instanceof BigNumber) {
                transformed.count = statObj.count;
              }
              // Create instance and manually assign properties to ensure they're set
              const instance = plainToInstance(AddCountStatDto, transformed, {
                excludeExtraneousValues: false,
              });
              // Manually assign properties to ensure readonly properties are set
              Object.assign(instance, transformed);
              return instance;
            }
            case StatType.Balance: {
              // Create instance and manually assign properties
              const instance = plainToInstance(AddPercentageStatDto, transformed, {
                excludeExtraneousValues: false,
              });
              Object.assign(instance, transformed);
              return instance;
            }
            case StatType.ScopedBalance: {
              // Create instance and manually assign properties
              const instance = plainToInstance(AddClaimPercentageStatDto, transformed, {
                excludeExtraneousValues: false,
              });
              Object.assign(instance, transformed);
              return instance;
            }
            case StatType.ScopedCount: {
              // Convert nested value BigNumber properties and create nested DTO instances
              if (
                statObj.value &&
                typeof statObj.value === 'object' &&
                !Array.isArray(statObj.value)
              ) {
                const valueObj = statObj.value as Record<string, unknown>;
                const transformedValue: Record<string, unknown> = {};
                Object.keys(valueObj).forEach(key => {
                  const val = valueObj[key];
                  if (
                    typeof val === 'string' &&
                    (key === 'accredited' ||
                      key === 'nonAccredited' ||
                      key === 'affiliate' ||
                      key === 'nonAffiliate')
                  ) {
                    transformedValue[key] = new BigNumber(val);
                  } else if (val instanceof BigNumber) {
                    transformedValue[key] = val;
                  } else {
                    transformedValue[key] = val;
                  }
                });

                // Create nested DTO instance
                let valueInstance;
                switch (statObj.claimType) {
                  case ClaimType.Accredited:
                    valueInstance = plainToInstance(
                      ClaimCountAccreditedValueDto,
                      transformedValue,
                      { excludeExtraneousValues: false }
                    );
                    Object.assign(valueInstance, transformedValue);
                    transformed.value = valueInstance;
                    break;
                  case ClaimType.Affiliate:
                    valueInstance = plainToInstance(ClaimCountAffiliateValueDto, transformedValue, {
                      excludeExtraneousValues: false,
                    });
                    Object.assign(valueInstance, transformedValue);
                    transformed.value = valueInstance;
                    break;
                  default:
                    transformed.value = transformedValue;
                }
              } else if (Array.isArray(statObj.value)) {
                // For Jurisdiction, transform array items to DTO instances
                transformed.value = statObj.value.map(
                  (item: { count?: string | BigNumber; countryCode?: string }) => {
                    const transformedItem: Record<string, unknown> = { ...item };
                    if (typeof item.count === 'string') {
                      transformedItem.count = new BigNumber(item.count);
                    } else if (item.count instanceof BigNumber) {
                      transformedItem.count = item.count;
                    }
                    const itemInstance = plainToInstance(
                      ClaimCountJurisdictionValueItemDto,
                      transformedItem,
                      { excludeExtraneousValues: false }
                    );
                    Object.assign(itemInstance, transformedItem);
                    return itemInstance;
                  }
                );
              }

              // Create appropriate instance based on claimType and manually assign properties
              let instance;
              switch (statObj.claimType) {
                case ClaimType.Accredited:
                  instance = plainToInstance(AddClaimCountAccreditedStatDto, transformed, {
                    excludeExtraneousValues: false,
                  });
                  Object.assign(instance, transformed);
                  return instance;
                case ClaimType.Affiliate:
                  instance = plainToInstance(AddClaimCountAffiliateStatDto, transformed, {
                    excludeExtraneousValues: false,
                  });
                  Object.assign(instance, transformed);
                  return instance;
                case ClaimType.Jurisdiction:
                  instance = plainToInstance(AddClaimCountJurisdictionStatDto, transformed, {
                    excludeExtraneousValues: false,
                  });
                  Object.assign(instance, transformed);
                  return instance;
                default:
                  return stat;
              }
            }
            default:
              return stat;
          }
        }

        // If it's already an instance, keep it as-is for validation
        // The service will handle conversion to plain objects if needed
        if (isInstance) {
          return stat;
        }

        return stat;
      });
    },
    { toClassOnly: true }
  );
}
