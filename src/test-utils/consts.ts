import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  PayingAccountType,
  TransactionStatus,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';
import { TransactionType } from '~/common/types';
import { UserModel } from '~/users/model/user.model';

const signer = 'alice';
const did = '0x01'.padEnd(66, '0');
const dryRun = false;
const ticker = 'TICKER';

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
  transactions: [
    {
      transactionTag: 'tag',
      type: TransactionType.Single,
      blockNumber: new BigNumber(1),
      blockHash: 'hash',
      transactionHash: 'hash',
    },
  ],
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
  ticker,
};

export const extrinsic = {
  blockHash: 'blockHash',
  blockNumber: new BigNumber(1000000),
  blockDate: new Date(),
  extrinsicIdx: new BigNumber(1),
  address: 'someAccount',
  nonce: new BigNumber(123456),
  txTag: TxTags.asset.RegisterTicker,
  params: [
    {
      name: 'ticker',
      value: 'TICKER',
    },
  ],
  success: true,
  specVersionId: new BigNumber(3002),
  extrinsicHash: 'extrinsicHash',
};

export const extrinsicWithFees = {
  ...extrinsic,
  fee: {
    gas: new BigNumber('1.234'),
    protocol: new BigNumber(0),
    total: new BigNumber('1.234'),
  },
};

export const getMockTransaction = (
  tag: string,
  type = TransactionType.Single
): TransactionModel | BatchTransactionModel => ({
  blockHash: '0x1',
  transactionHash: '0x2',
  blockNumber: new BigNumber(1),
  type,
  transactionTag: tag,
});
