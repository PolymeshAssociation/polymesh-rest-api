/* istanbul ignore file */

import { ClaimType, StatType } from '@polymeshassociation/polymesh-sdk/types';
import { plainToInstance, Transform } from 'class-transformer';

import { AddClaimCountAccreditedStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-accredited-stat.dto';
import { AddClaimCountAffiliateStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-affiliate-stat.dto';
import { AddClaimCountJurisdictionStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-count-jurisdiction-stat.dto';
import { AddClaimPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-claim-percentage-stat.dto';
import { AddCountStatDto } from '~/assets/dto/transfer-restrictions/stats/add-count-stat.dto';
import { AddPercentageStatDto } from '~/assets/dto/transfer-restrictions/stats/add-percentage-stat.dto';

/**
 * Custom transformer for ScopedCount statistics that discriminates based on claimType
 * This handles the case where multiple DTOs have the same 'type' but different 'claimType'
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

        const scopedStat = stat as { claimType?: ClaimType; type?: StatType };

        if (
          stat instanceof AddCountStatDto ||
          stat instanceof AddPercentageStatDto ||
          stat instanceof AddClaimPercentageStatDto ||
          stat instanceof AddClaimCountAccreditedStatDto ||
          stat instanceof AddClaimCountAffiliateStatDto ||
          stat instanceof AddClaimCountJurisdictionStatDto
        ) {
          return stat;
        }

        switch (scopedStat.type) {
          case StatType.Count:
            return plainToInstance(AddCountStatDto, stat);
          case StatType.Balance:
            return plainToInstance(AddPercentageStatDto, stat);
          case StatType.ScopedBalance:
            return plainToInstance(AddClaimPercentageStatDto, stat);
          case StatType.ScopedCount:
            switch (scopedStat.claimType) {
              case ClaimType.Accredited:
                return plainToInstance(AddClaimCountAccreditedStatDto, stat);
              case ClaimType.Affiliate:
                return plainToInstance(AddClaimCountAffiliateStatDto, stat);
              case ClaimType.Jurisdiction:
                return plainToInstance(AddClaimCountJurisdictionStatDto, stat);
              default:
                return stat;
            }
          default:
            return stat;
        }
      });
    },
    { toClassOnly: true }
  );
}
