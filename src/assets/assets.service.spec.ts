/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AffirmationStatus,
  CustomPermissionGroup,
  KnownAssetType,
  KnownPermissionGroup,
  PermissionGroupType,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { InviteAgentToGroupDto } from '~/assets/dto/invite-agent-to-group.dto';
import { RemoveAgentFromGroupDto } from '~/assets/dto/remove-agent-from-grop.dto';
import { AppNotFoundError } from '~/common/errors';
import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { testValues } from '~/test-utils/consts';
import {
  MockAsset,
  MockAuthorizationRequest,
  MockIdentity,
  MockPolymesh,
  MockTransaction,
} from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';
import * as transactionsUtilModule from '~/transactions/transactions.util';

const { did, signer, assetId } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('AssetsService', () => {
  let service: AssetsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockTransactionsService = mockTransactionsProvider.useValue;
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [AssetsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    service = module.get<AssetsService>(AssetsService);
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

  describe('findOne', () => {
    it('should return the Asset for a valid ticker', async () => {
      const mockAsset = new MockAsset();

      when(mockPolymeshApi.assets.getAsset)
        .calledWith({ ticker: 'TICKER' })
        .mockResolvedValue(mockAsset);

      const result = await service.findOne('TICKER');

      expect(result).toEqual(mockAsset);
    });

    it('should return the Asset for a valid Asset ID', async () => {
      const mockAsset = new MockAsset();

      when(mockPolymeshApi.assets.getAsset).calledWith({ assetId }).mockResolvedValue(mockAsset);

      const result = await service.findOne(assetId);

      expect(result).toEqual(mockAsset);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.assets.getAsset.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        const address = 'address';

        await expect(() => service.findOne(address)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('findFungible', () => {
    it('should return the Asset for a valid ticker', async () => {
      const mockAsset = new MockAsset();

      mockPolymeshApi.assets.getFungibleAsset.mockResolvedValue(mockAsset);

      const result = await service.findFungible('TICKER');

      expect(result).toEqual(mockAsset);
    });

    describe('otherwise', () => {
      it('should call the handleSdkError method and throw an error', async () => {
        const mockError = new Error('Some Error');
        mockPolymeshApi.assets.getFungibleAsset.mockRejectedValue(mockError);

        const handleSdkErrorSpy = jest.spyOn(transactionsUtilModule, 'handleSdkError');

        const address = 'address';

        await expect(() => service.findFungible(address)).rejects.toThrowError();

        expect(handleSdkErrorSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  describe('findAllByOwner', () => {
    describe('if the identity does not exist', () => {
      it('should throw a AppNotFoundError', async () => {
        mockPolymeshApi.identities.isIdentityValid.mockResolvedValue(false);

        let error;
        try {
          await service.findAllByOwner('TICKER');
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(AppNotFoundError);
      });
    });
    describe('otherwise', () => {
      it('should return a list of Assets', async () => {
        mockPolymeshApi.identities.isIdentityValid.mockResolvedValue(true);

        const assets = [{ ticker: 'FOO' }, { ticker: 'BAR' }, { ticker: 'BAZ' }];

        mockPolymeshApi.assets.getAssets.mockResolvedValue(assets);

        const result = await service.findAllByOwner('0x1');

        expect(result).toEqual(assets);
      });
    });
  });

  describe('findHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: did,
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset holders', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findFungible');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.assetHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', new BigNumber(10));
      expect(result).toEqual(mockHolders);
    });

    it('should return the list of Asset holders from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findFungible');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.assetHolders.get.mockResolvedValue(mockHolders);

      const result = await service.findHolders('TICKER', new BigNumber(10), 'NEXT_KEY');
      expect(result).toEqual(mockHolders);
    });
  });

  describe('findDocuments', () => {
    const mockAssetDocuments = {
      data: [
        {
          name: 'TEST-DOC',
          uri: 'URI',
          contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset documents', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', new BigNumber(10));
      expect(result).toEqual(mockAssetDocuments);
    });

    it('should return the list of Asset documents from a start value', async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);
      mockAsset.documents.get.mockResolvedValue(mockAssetDocuments);

      const result = await service.findDocuments('TICKER', new BigNumber(10), 'NEXT_KEY');
      expect(result).toEqual(mockAssetDocuments);
    });
  });

  describe('setDocuments', () => {
    it('should run a set procedure and return the queue results', async () => {
      const mockAsset = new MockAsset();
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.AddDocuments,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const body = {
        signer,
        documents: [
          new AssetDocumentDto({
            name: 'TEST-DOC',
            uri: 'URI',
            contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
          }),
        ],
      };

      const result = await service.setDocuments('TICKER', body);
      expect(result).toEqual({
        result: mockAsset,
        transactions: [mockTransaction],
      });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.documents.set,
        { documents: body.documents },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('createAsset', () => {
    const createBody = {
      signer,
      name: 'Ticker Corp',
      ticker: 'TICKER',
      isDivisible: false,
      assetType: KnownAssetType.EquityCommon,
    };

    it('should create the asset', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.CreateAsset,
      };
      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        result: mockAsset,
        transactions: [mockTransaction],
      });

      const result = await service.createAsset(createBody);
      expect(result).toEqual({
        result: mockAsset,
        transactions: [mockTransaction],
      });
    });
  });

  describe('issue', () => {
    const issueBody = {
      signer,
      amount: new BigNumber(1000),
    };
    it('should issue the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Issue,
      };
      const findSpy = jest.spyOn(service, 'findFungible');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.issue('TICKER', issueBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('transferOwnership', () => {
    const ticker = 'TICKER';
    const body = {
      signer,
      target: '0x1000',
      expiry: new Date(),
    };

    it('should run a transferOwnership procedure and return the queue data', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddAuthorization,
      };
      const mockResult = new MockAuthorizationRequest();

      const mockTransaction = new MockTransaction(transaction);
      mockTransaction.run.mockResolvedValue(mockResult);

      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({
        result: mockResult,
        transactions: [mockTransaction],
      });

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      const result = await service.transferOwnership(ticker, body);
      expect(result).toEqual({
        result: mockResult,
        transactions: [mockTransaction],
      });
    });
  });

  describe('redeem', () => {
    const amount = new BigNumber(1000);
    const from = new BigNumber(1);
    const redeemBody = {
      signer,
      amount,
      from,
    };

    it('should run a redeem procedure and return the queue results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Redeem,
      };
      const findSpy = jest.spyOn(service, 'findFungible');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      when(mockTransactionsService.submit)
        .calledWith(mockAsset.redeem, { amount, from }, expect.objectContaining({ signer }))
        .mockResolvedValue({ transactions: [mockTransaction] });

      let result = await service.redeem('TICKER', redeemBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      when(mockTransactionsService.submit)
        .calledWith(mockAsset.redeem, { amount }, expect.objectContaining({ signer }))
        .mockResolvedValue({ transactions: [mockTransaction] });

      result = await service.redeem('TICKER', { ...redeemBody, from: new BigNumber(0) });
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('freeze', () => {
    const freezeBody = {
      signer,
    };
    it('should freeze the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Freeze,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.freeze('TICKER', freezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('unfreeze', () => {
    const unfreezeBody = {
      signer,
    };
    it('should unfreeze the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.Unfreeze,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.unfreeze('TICKER', unfreezeBody);
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('controllerTransfer', () => {
    it('should run a controllerTransfer procedure and return the queue results', async () => {
      const origin = new PortfolioDto({ id: new BigNumber(1), did });
      const amount = new BigNumber(100);

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.ControllerTransfer,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.controllerTransfer.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findSpy = jest.spyOn(service, 'findFungible');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.controllerTransfer('TICKER', { signer, origin, amount });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.controllerTransfer,
        {
          originPortfolio: {
            identity: did,
            id: new BigNumber(1),
          },
          amount,
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('getOperationHistory', () => {
    it("should return the Asset's operation history", async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findFungible');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      const mockOperations = [
        {
          identity: {
            did: 'Ox6'.padEnd(66, '0'),
          },
          history: [
            {
              blockNumber: new BigNumber(123),
              blockHash: 'blockHash',
              blockDate: new Date('07/11/2022'),
              eventIndex: new BigNumber(1),
            },
          ],
        },
      ];
      mockAsset.getOperationHistory.mockResolvedValue(mockOperations);

      const result = await service.getOperationHistory('TICKER');
      expect(result).toEqual(mockOperations);
    });
  });

  describe('getRequiredMediators', () => {
    it("should return the Asset's required mediators", async () => {
      const mockAsset = new MockAsset();

      const findOneSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneSpy.mockResolvedValue(mockAsset as any);

      const identity = new MockIdentity();

      const mockMediators = [
        {
          identity,
          status: AffirmationStatus.Pending,
        },
      ];
      mockAsset.getRequiredMediators.mockResolvedValue(mockMediators);

      const result = await service.getRequiredMediators('TICKER');
      expect(result).toEqual(mockMediators);
    });
  });

  describe('addRequiredMediators', () => {
    it('should run a addRequiredMediators procedure and return the transaction results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.AddMandatoryMediators,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.addRequiredMediators.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.addRequiredMediators('TICKER', {
        signer,
        mediators: ['someDid'],
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.addRequiredMediators,
        {
          mediators: ['someDid'],
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('removeRequiredMediators', () => {
    it('should run a removeRequiredMediators procedure and return the transaction results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RemoveMandatoryMediators,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.removeRequiredMediators.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const findSpy = jest.spyOn(service, 'findOne');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.removeRequiredMediators('TICKER', {
        signer,
        mediators: ['someDid'],
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.removeRequiredMediators,
        {
          mediators: ['someDid'],
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('preApprove', () => {
    it('should run a preApproveTicker procedure and return the transaction results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.PreApproveTicker,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.settlements.preApprove.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsset as any);

      const result = await service.preApprove('TICKER', {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.settlements.preApprove,
        {},
        expect.objectContaining({ signer })
      );
    });
  });

  describe('removePreApproval', () => {
    it('should run a removePreApproval procedure and return the transaction results', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.RemoveTickerPreApproval,
      };
      const mockTransaction = new MockTransaction(transaction);

      const mockAsset = new MockAsset();
      mockAsset.settlements.removePreApproval.mockResolvedValue(mockTransaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsset as any);

      const result = await service.removePreApproval('TICKER', {
        signer,
      });

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.settlements.removePreApproval,
        {},
        expect.objectContaining({ signer })
      );
    });
  });

  describe('linkTickerToAsset', () => {
    it('should link the given ticker', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.LinkTickerToAssetId,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.linkTickerToAsset(assetId, { signer, ticker: 'TICKER' });
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.linkTicker,
        {
          ticker: 'TICKER',
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('unlinkTickerFromAsset', () => {
    it('should unlink the ticker from the asset', async () => {
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.asset.UnlinkTickerFromAssetId,
      };
      const findSpy = jest.spyOn(service, 'findOne');

      const mockTransaction = new MockTransaction(transaction);
      const mockAsset = new MockAsset();
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);

      const result = await service.unlinkTickerFromAsset(assetId, { signer });
      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.unlinkTicker,
        {},
        expect.objectContaining({ signer })
      );
    });
  });

  describe('createPermissionGroup', () => {
    let findSpy: jest.SpyInstance;
    let mockAsset: MockAsset;
    let mockPermissionGroup: CustomPermissionGroup;
    let mockTransaction: MockTransaction;

    beforeEach(() => {
      findSpy = jest.spyOn(service, 'findOne');
      mockAsset = new MockAsset();
      mockPermissionGroup = createMock<CustomPermissionGroup>();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.externalAgents.CreateGroup,
      };
      mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
        result: mockPermissionGroup,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);
    });

    it('should create a permission group with the given transaction group permissions', async () => {
      const result = await service.createPermissionGroup(assetId, {
        signer,
        transactionGroups: [TxGroup.Distribution],
      });

      expect(result).toEqual({
        result: mockPermissionGroup,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.createGroup,
        expect.objectContaining({
          permissions: {
            transactionGroups: [TxGroup.Distribution],
          },
        }),
        expect.objectContaining({ signer })
      );
    });

    it('should create a permission group with the given transaction permissions', async () => {
      const transactions = new TransactionPermissionsDto({
        values: [TxTags.asset.RegisterUniqueTicker],
        type: PermissionType.Include,
        exceptions: [TxTags.asset.AcceptTickerTransfer],
      });

      const result = await service.createPermissionGroup(assetId, { signer, transactions });

      expect(result).toEqual({
        result: mockPermissionGroup,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.createGroup,
        expect.objectContaining({
          permissions: {
            transactions,
          },
        }),
        expect.objectContaining({ signer })
      );
    });
  });

  describe('getPermissionGroupsWithPermissions', () => {
    let findSpy: jest.SpyInstance;
    let mockAsset: MockAsset;

    beforeEach(() => {
      findSpy = jest.spyOn(service, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);
    });

    it('should return both custom and known permission groups with their permissions', async () => {
      const mockCustomPermissions = { transactionGroups: [TxGroup.Distribution] };
      const mockKnownPermissions = { transactionGroups: [TxGroup.AssetManagement] };
      const mockCustomGroup = createMock<CustomPermissionGroup>({
        id: new BigNumber(1),
        getPermissions: jest.fn().mockResolvedValue(mockCustomPermissions),
      });
      const mockKnownGroup = createMock<KnownPermissionGroup>({
        type: PermissionGroupType.Full,
        getPermissions: jest.fn().mockResolvedValue(mockKnownPermissions),
      });

      mockAsset.permissions.getGroups.mockResolvedValue({
        custom: [mockCustomGroup],
        known: [mockKnownGroup],
      });

      const result = await service.getPermissionGroupsWithPermissions(assetId);

      expect(result).toEqual([
        {
          id: mockCustomGroup.id,
          permissions: mockCustomPermissions,
        },
        {
          type: mockKnownGroup.type,
          permissions: mockKnownPermissions,
        },
      ]);

      expect(mockAsset.permissions.getGroups).toHaveBeenCalled();
      expect(mockCustomGroup.getPermissions).toHaveBeenCalled();
      expect(mockKnownGroup.getPermissions).toHaveBeenCalled();
    });

    it('should handle empty permission groups', async () => {
      mockAsset.permissions.getGroups.mockResolvedValue({
        custom: [],
        known: [],
      });

      const result = await service.getPermissionGroupsWithPermissions(assetId);

      expect(result).toEqual([]);
      expect(mockAsset.permissions.getGroups).toHaveBeenCalled();
    });
  });

  describe('inviteAgentToGroup', () => {
    let mockAsset: MockAsset;
    let findSpy: jest.SpyInstance;
    const transaction = {
      blockHash: '0x1',
      txHash: '0x2',
      blockNumber: new BigNumber(1),
      tag: TxTags.identity.AddAuthorization,
    };

    beforeEach(() => {
      findSpy = jest.spyOn(service, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);
    });

    it('should invite an agent to a permission group', async () => {
      const mockTransaction = new MockTransaction(transaction);
      const dto: InviteAgentToGroupDto = {
        target: did,
        permissions: PermissionGroupType.Full,
        signer,
      };

      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      mockAsset.permissions.getGroup.mockResolvedValue({ type: PermissionGroupType.Full });

      const result = await service.inviteAgentToGroup(assetId, dto);

      expect(result).toBeDefined();
      expect(findSpy).toHaveBeenCalledWith(assetId);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.inviteAgent,
        {
          target: dto.target,
          permissions: { type: PermissionGroupType.Full },
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('removeAgentFromAsset', () => {
    let mockAsset: MockAsset;
    let findSpy: jest.SpyInstance;
    const transaction = {
      blockHash: '0x1',
      txHash: '0x2',
      blockNumber: new BigNumber(1),
      tag: TxTags.externalAgents.RemoveAgent,
    };

    beforeEach(() => {
      findSpy = jest.spyOn(service, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findSpy.mockResolvedValue(mockAsset as any);
    });

    it('should remove an agent from the asset', async () => {
      const mockTransaction = new MockTransaction(transaction);
      const dto: RemoveAgentFromGroupDto = {
        target: did,
        signer,
      };

      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.removeAgentFromAsset(assetId, dto);

      expect(result).toBeDefined();
      expect(findSpy).toHaveBeenCalledWith(assetId);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.removeAgent,
        {
          target: dto.target,
        },
        expect.objectContaining({ signer })
      );
    });
  });
});
