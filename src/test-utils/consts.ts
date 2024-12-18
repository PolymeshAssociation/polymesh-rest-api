import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  PayingAccountType,
  TransactionStatus,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { ProcessMode, TransactionType } from '~/common/types';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { DirectTransactionResult } from '~/transactions/transactions.util';
import { ResultType } from '~/transactions/types';
import { UserModel } from '~/users/model/user.model';

const signer = 'alice';
const options = { signer, processMode: ProcessMode.Submit };
const did = '0x01'.padEnd(66, '0');
const dryRun = false;
const ticker = 'TICKER';
const assetId = '3616b82e-8e10-80ae-dc95-2ea28b9db8b3';
const blockNumber = new BigNumber(1);
const blockHash = '0xec1d41dd553ce03c3e462aab8bcfba0e1726e6bf310db6e06a933bf0430419c0';
const date = new Date('2001-01-01');

const user = new UserModel({
  id: '-1',
  name: 'TestUser',
});

const resource = {
  type: 'TestResource',
  id: '-1',
} as const;

const offlineTx = new OfflineTxModel({
  id: '-1',
  payload: {
    payload: {
      address: 'address',
      blockHash: '0x01',
      blockNumber: '0x01',
      genesisHash: '0x01',
      era: '0x01',
      method: 'testMethod',
      nonce: '0x01',
      specVersion: '0x01',
      tip: '0x00',
      transactionVersion: '0x01',
      signedExtensions: [],
      version: 1,
    },
    method: '0x01',
    rawPayload: { address: 'address', data: '0x01', type: 'bytes' },
    metadata: { memo: 'test utils payload' },
    multiSig: null,
  },
  status: OfflineTxStatus.Signed,
  signature: '0x01',
  address: 'someAddress',
  nonce: 1,
});

export const testAccount = createMock<Account>({ address: 'address' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const txResult: DirectTransactionResult<any> = {
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
  resultType: ResultType.Direct,
  result: undefined,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { result: unusedResult, resultType: unusedType, ...processedResult } = txResult;
/**
 * @hidden
 *
 * like `txResult`, but without properties not meant for public response API
 */
export const processedTxResult = processedResult;

export const testValues = {
  signer,
  options,
  did,
  user,
  offlineTx,
  resource,
  testAccount,
  txResult,
  processedTxResult,
  dryRun,
  ticker,
  assetId,
  blockNumber,
  blockHash,
  date,
};

export const extrinsic = {
  blockHash: 'blockHash',
  blockNumber: new BigNumber(1000000),
  blockDate: new Date(),
  extrinsicIdx: new BigNumber(1),
  address: 'someAccount',
  nonce: new BigNumber(123456),
  txTag: TxTags.asset.RegisterUniqueTicker,
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
