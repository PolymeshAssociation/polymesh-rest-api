import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Account , PayingAccountType, TransactionStatus } from '@polymeshassociation/polymesh-sdk/types';

import { UserModel } from '~/users/model/user.model';

const signer = 'alice';
const did = '0x01'.padEnd(66, '0');
const dryRun = false;

const user = new UserModel({
  id: '-1',
  name: 'TestUser',
});

const resource = {
  type: 'TestResource',
  id: '-1',
} as const;

export const testAccount = createMock<Account>({ address: 'address' });
export const txResult = {
  transactions: ['transaction'],
  details: {
    status: TransactionStatus.Succeeded,
    fees: {
      gas: new BigNumber(1),
      protocol: new BigNumber(1),
      total: new BigNumber(1),
    },
    supportsSubsidy: false,
    payingAccount: {
      address: did,
      balance: new BigNumber(1),
      type: PayingAccountType.Caller,
    },
  },
};

export const testValues = {
  signer,
  did,
  user,
  resource,
  testAccount,
  txResult,
  dryRun,
};
