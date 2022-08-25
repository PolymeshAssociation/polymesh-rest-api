/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
} from '@polymeshassociation/polymesh-sdk/types';

import { MockOffering, MockPortfolio, MockVenue } from '~/test-utils/mocks';

export class MockOfferingWithDetails {
  offering = new MockOffering();

  details = {
    tiers: [
      {
        amount: new BigNumber(1000),
        price: new BigNumber(1),
        remaining: new BigNumber(1000),
      },
    ],
    creator: {
      did: 'Ox6'.padEnd(66, '0'),
    },
    name: 'SERIES A',
    offeringPortfolio: new MockPortfolio(),
    raisingPortfolio: new MockPortfolio(),
    raisingCurrency: 'CURRENCY',
    venue: new MockVenue(),
    start: new Date(),
    end: null,
    status: {
      timing: OfferingTimingStatus.Started,
      balance: OfferingBalanceStatus.Available,
      sale: OfferingSaleStatus.Live,
    },
    minInvestment: new BigNumber(1),
    totalAmount: new BigNumber(1000),
    totalRemaining: new BigNumber(1000),
  };
}
