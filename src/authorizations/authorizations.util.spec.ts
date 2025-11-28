import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AuthorizationRequest,
  PayingAccountType,
  TransactionStatus,
} from '@polymeshassociation/polymesh-sdk/types';
import { isAccount } from '@polymeshassociation/polymesh-sdk/utils';

import {
  authorizationRequestResolver,
  createAuthorizationRequestModel,
} from '~/authorizations/authorizations.util';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { TransactionDetails } from '~/transactions/transactions.util';
import { ResultType } from '~/transactions/types';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  isAccount: jest.fn(),
}));

const mockIsAccount = isAccount as unknown as jest.MockedFunction<typeof isAccount>;

describe('authorizations.util', () => {
  beforeEach(() => {
    mockIsAccount.mockImplementation((val: unknown) =>
      Boolean((val as { address?: string } | undefined)?.address)
    );
  });

  it('creates authorization request models', () => {
    const model = createAuthorizationRequestModel({
      authId: '1',
      expiry: new Date(),
      data: { type: 'SomeAuth' },
      issuer: { did: 'issuer' },
      target: { did: 'addr' },
    } as unknown as AuthorizationRequest);

    expect(model.id).toBe('1');
  });

  it('resolves authorization requests into created models', () => {
    const resolverResult = authorizationRequestResolver({
      resultType: ResultType.Direct,
      transactions: [
        {
          blockHash: '0x01',
          transactionHash: '0x02',
          blockNumber: new BigNumber(1),
          transactionTag: 'SomeTag',
        } as unknown as TransactionQueueModel['transactions'][number],
      ] as TransactionQueueModel['transactions'],
      details: {
        status: TransactionStatus.Idle,
        fees: {} as never,
        supportsSubsidy: false,
        payingAccount: {
          type: PayingAccountType.Caller,
          address: 'addr',
          balance: new BigNumber(0),
        },
      } as TransactionDetails,
      result: {
        authId: '2',
        expiry: null,
        data: { type: 'Test' },
        issuer: { did: 'issuer' },
        target: { did: 'did' },
      } as unknown as AuthorizationRequest,
    });

    const model = resolverResult as CreatedAuthorizationRequestModel;
    expect(model.authorizationRequest.id).toBe('2');
    expect(model.transactions).toHaveLength(1);
  });
});
