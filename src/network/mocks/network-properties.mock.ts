import { BigNumber } from '@polymeshassociation/polymesh-sdk';

export class MockNetworkProperties {
  name = 'Development';

  version = new BigNumber(1);

  genesisHash = '0xabc';
}
