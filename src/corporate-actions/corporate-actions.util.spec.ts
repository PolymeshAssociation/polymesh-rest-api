import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { DividendDistribution } from '@polymeshassociation/polymesh-sdk/types';

import {
  createDividendDistributionDetailsModel,
  createDividendDistributionModel,
} from '~/corporate-actions/corporate-actions.util';

const createMockDistribution = (): DeepMocked<DividendDistribution> =>
  createMock<DividendDistribution>({
    origin: {
      toHuman: () => ({ did: 'did', id: '1' }),
    },
    currency: 'USD',
    perShare: new BigNumber(1),
    maxAmount: new BigNumber(10),
    expiryDate: new Date(),
    paymentDate: new Date(),
    id: new BigNumber(1),
    asset: { id: 'assetId' },
    declarationDate: new Date(),
    description: 'desc',
    targets: { identities: [], treatment: 'Include' } as DividendDistribution['targets'],
    defaultTaxWithholding: new BigNumber(0),
    taxWithholdings: [],
  });

describe('corporate-actions.util', () => {
  it('creates dividend distribution models', () => {
    const distribution = createMockDistribution();

    const model = createDividendDistributionModel(distribution);
    expect(model.asset).toBe(distribution.asset.id);
    expect(model.origin).toBeDefined();
  });

  it('creates distribution detail models', () => {
    const combined = createDividendDistributionDetailsModel({
      distribution: createMockDistribution(),
      details: { remainingFunds: new BigNumber(0), fundsReclaimed: false },
    });

    expect(combined.remainingFunds.toString()).toBe('0');
    expect(combined.id).toStrictEqual(new BigNumber(1));
  });
});
