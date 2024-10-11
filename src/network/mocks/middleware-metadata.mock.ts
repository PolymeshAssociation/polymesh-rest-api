import { BigNumber } from '@polymeshassociation/polymesh-sdk';

export class MockMiddlewareMetadata {
  chain = 'Development';

  genesisHash = '0xabc';

  indexerHealthy = true;

  lastProcessedHeight = new BigNumber(1);

  lastProcessedTimestamp = new Date('2021-01-01T00:00:00.000Z');

  specName = '2';

  targetHeight = new BigNumber(1);

  sqVersion = '1';
}
