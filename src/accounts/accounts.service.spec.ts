/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { MockPolymesh, MockTransactionQueue } from '~/test-utils/mocks';
import { MockRelayerAccountsService } from '~/test-utils/service-mocks';
import { ErrorCase } from '~/test-utils/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AccountsService', () => {
  let service: AccountsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockRelayerAccountsService: MockRelayerAccountsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockRelayerAccountsService = new MockRelayerAccountsService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, RelayerAccountsModule],
      providers: [AccountsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<AccountsService>(AccountsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccountBalance', () => {
    it('should return the POLYX balance of an Account', async () => {
      const fakeBalance = 'balance';

      mockPolymeshApi.accountManagement.getAccountBalance.mockReturnValue(fakeBalance);

      const result = await service.getAccountBalance('fakeAccount');

      expect(result).toBe(fakeBalance);
    });
  });

  describe('transferPolyx', () => {
    describe('errors', () => {
      const cases: ErrorCase[] = [
        [
          'Insufficient free balance',
          {
            code: ErrorCode.InsufficientBalance,
            message: 'Insufficient free balance',
            data: {
              freeBalance: new BigNumber(10),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Destination Account without any Identity',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: "The destination Account doesn't have an associated Identity",
          },
          UnprocessableEntityException,
        ],
        [
          'Invalid CDD claim with receiver Identity',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The receiver Identity has an invalid CDD claim',
          },
          UnprocessableEntityException,
        ],
      ];

      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          to: 'address',
          amount: new BigNumber(10),
          memo: 'Sample memo',
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        mockPolymeshApi.network.transferPolyx.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.transferPolyx(body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(HttpException);
        expect(mockPolymeshApi.network.transferPolyx).toHaveBeenCalled();
        mockIsPolymeshError.mockReset();
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.balances.TransferWithMemo,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockPolymeshApi.network.transferPolyx.mockResolvedValue(mockQueue);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          to: 'address',
          amount: new BigNumber(10),
          memo: 'Sample memo',
        };

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.transferPolyx(body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.balances.TransferWithMemo,
            },
          ],
        });
        expect(mockPolymeshApi.network.transferPolyx).toHaveBeenCalled();
      });
    });
  });
});
