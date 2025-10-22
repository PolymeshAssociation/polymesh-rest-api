/* istanbul ignore file */

import { AssetStat, StatType } from '@polymeshassociation/polymesh-sdk/types';

import { AssetStatModel } from '~/assets/models/asset-stat.model';

describe('AssetStatModel', () => {
  describe('constructor', () => {
    it('should create a model for Count statistic', () => {
      const mockStat = {
        type: StatType.Count,
      };

      const model = new AssetStatModel(mockStat);

      expect(model.type).toBe(StatType.Count);
      expect(model.claimIssuer).toBeUndefined();
    });

    it('should create a model for Balance statistic', () => {
      const mockStat = {
        type: StatType.Balance,
      };

      const model = new AssetStatModel(mockStat);

      expect(model.type).toBe(StatType.Balance);
      expect(model.claimIssuer).toBeUndefined();
    });

    it('should create a model for ScopedCount statistic with claimIssuer', () => {
      const mockStat = {
        type: StatType.ScopedCount,
        claimIssuer: {
          issuer: { did: '0x0600000000000000000000000000000000000000000000000000000000000000' },
          claimType: 'Accredited',
        },
      } as unknown as AssetStat;

      const model = new AssetStatModel(mockStat);

      expect(model.type).toBe(StatType.ScopedCount);
      expect(model.claimIssuer).toBeDefined();
      expect(model.claimIssuer?.issuer).toBe(
        '0x0600000000000000000000000000000000000000000000000000000000000000'
      );
      expect(model.claimIssuer?.claimType).toBe('Accredited');
    });

    it('should create a model for ScopedBalance statistic with claimIssuer', () => {
      const mockStat = {
        type: StatType.ScopedBalance,
        claimIssuer: {
          issuer: { did: '0x0700000000000000000000000000000000000000000000000000000000000000' },
          claimType: 'Jurisdiction',
        },
      } as unknown as AssetStat;

      const model = new AssetStatModel(mockStat);

      expect(model.type).toBe(StatType.ScopedBalance);
      expect(model.claimIssuer).toBeDefined();
      expect(model.claimIssuer?.issuer).toBe(
        '0x0700000000000000000000000000000000000000000000000000000000000000'
      );
      expect(model.claimIssuer?.claimType).toBe('Jurisdiction');
    });
  });
});
