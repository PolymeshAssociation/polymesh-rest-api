/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CustomPermissionGroup,
  Identity,
  PermissionGroupType,
  PermissionType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AppNotFoundError } from '~/common/errors';
import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';
import { IdentitiesService } from '~/identities/identities.service';
import { InviteAgentToGroupDto } from '~/permission-groups/dto/invite-agent-to-group.dto';
import { RemoveAgentFromGroupDto } from '~/permission-groups/dto/remove-agent-from-grop.dto';
import { PermissionGroupsService } from '~/permission-groups/permission-groups.service';
import { testValues } from '~/test-utils/consts';
import { MockAsset, MockTransaction } from '~/test-utils/mocks';
import {
  MockAssetService,
  MockIdentitiesService,
  mockTransactionsProvider,
  MockTransactionsService,
} from '~/test-utils/service-mocks';

const { did, signer, assetId } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('PermissionGroupsService', () => {
  let service: PermissionGroupsService;
  const mockAssetsService = new MockAssetService();
  const mockIdentitiesService = new MockIdentitiesService();
  let mockTransactionsService: MockTransactionsService;

  beforeEach(async () => {
    mockTransactionsService = mockTransactionsProvider.useValue;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGroupsService,
        mockTransactionsProvider,
        AssetsService,
        IdentitiesService,
      ],
    })
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<PermissionGroupsService>(PermissionGroupsService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPermissionGroup', () => {
    let findAssetSpy: jest.SpyInstance;
    let mockAsset: MockAsset;
    let mockPermissionGroup: CustomPermissionGroup;
    let mockTransaction: MockTransaction;

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
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
      findAssetSpy.mockResolvedValue(mockAsset as any);
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

  describe('getPermissionGroups', () => {
    let findAssetSpy: jest.SpyInstance;
    let mockAsset: MockAsset;

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findAssetSpy.mockResolvedValue(mockAsset as any);
    });

    it('should return list of custom permission groups', async () => {
      const mockCustomPermissions = {
        id: new BigNumber(1),
        transactionGroups: [TxGroup.Distribution],
      };
      const mockCustomGroup = createMock<CustomPermissionGroup>({
        id: new BigNumber(1),
        getPermissions: jest.fn().mockResolvedValue(mockCustomPermissions),
      });

      mockAsset.permissions.getGroups.mockResolvedValue({
        custom: [mockCustomGroup],
        known: [],
      });

      const result = await service.getPermissionGroups(assetId);

      expect(result).toEqual([mockCustomGroup.id]);

      expect(mockAsset.permissions.getGroups).toHaveBeenCalled();
    });

    it('should handle empty permission groups', async () => {
      mockAsset.permissions.getGroups.mockResolvedValue({
        custom: [],
        known: [],
      });

      const result = await service.getPermissionGroups(assetId);

      expect(result).toEqual([]);
      expect(mockAsset.permissions.getGroups).toHaveBeenCalled();
    });
  });

  describe('inviteAgentToGroup', () => {
    let mockAsset: MockAsset;
    let findAssetSpy: jest.SpyInstance;
    const transaction = {
      blockHash: '0x1',
      txHash: '0x2',
      blockNumber: new BigNumber(1),
      tag: TxTags.identity.AddAuthorization,
    };

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findAssetSpy.mockResolvedValue(mockAsset as any);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should invite an agent to a permission group', async () => {
      const mockIdentity = createMock<Identity>({ did });
      const mockTransaction = new MockTransaction(transaction);
      const dto: InviteAgentToGroupDto = {
        target: did,
        permissions: PermissionGroupType.Full,
        signer,
      };

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      mockAsset.permissions.getGroup.mockResolvedValue({ type: PermissionGroupType.Full });

      const result = await service.inviteAgentToGroup(assetId, dto);

      expect(result).toBeDefined();
      expect(findAssetSpy).toHaveBeenCalledWith(assetId);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.inviteAgent,
        {
          target: mockIdentity,
          permissions: { type: PermissionGroupType.Full },
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('removeAgentFromAsset', () => {
    let mockAsset: MockAsset;
    let findAssetSpy: jest.SpyInstance;
    const transaction = {
      blockHash: '0x1',
      txHash: '0x2',
      blockNumber: new BigNumber(1),
      tag: TxTags.externalAgents.RemoveAgent,
    };

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findAssetSpy.mockResolvedValue(mockAsset as any);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should remove an agent from the asset', async () => {
      const mockIdentity = createMock<Identity>({ did });
      const mockTransaction = new MockTransaction(transaction);
      const dto: RemoveAgentFromGroupDto = {
        target: did,
        signer,
      };

      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.removeAgentFromAsset(assetId, dto);

      expect(result).toBeDefined();
      expect(findAssetSpy).toHaveBeenCalledWith(assetId);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.removeAgent,
        {
          target: mockIdentity,
        },
        expect.objectContaining({ signer })
      );
    });
  });

  describe('getGroupPermissions', () => {
    let findAssetSpy: jest.SpyInstance;
    let mockAsset: MockAsset;

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findAssetSpy.mockResolvedValue(mockAsset as any);
    });

    it('should return both custom and known permission groups with their permissions', async () => {
      const mockCustomPermissions = { transactionGroups: [TxGroup.Distribution] };
      const mockCustomGroup = createMock<CustomPermissionGroup>({
        id: new BigNumber(1),
        getPermissions: jest.fn().mockResolvedValue(mockCustomPermissions),
        exists: jest.fn().mockResolvedValue(true),
      });

      mockAsset.permissions.getGroup.mockResolvedValue(mockCustomGroup);

      const result = await service.getGroupPermissions({ asset: assetId, id: new BigNumber(1) });

      expect(result).toEqual({
        id: mockCustomGroup.id,
        permissions: mockCustomPermissions,
      });

      expect(mockAsset.permissions.getGroup).toHaveBeenCalled();
      expect(mockCustomGroup.getPermissions).toHaveBeenCalled();
    });

    it('should throw an error if the custom permission group does not exist', async () => {
      const mockNotFoundGroup = createMock<CustomPermissionGroup>({
        exists: jest.fn().mockResolvedValue(false),
        getPermissions: jest.fn(),
      });
      mockAsset.permissions.getGroup.mockResolvedValue(mockNotFoundGroup);

      await expect(
        service.getGroupPermissions({ asset: assetId, id: new BigNumber(1) })
      ).rejects.toThrow(AppNotFoundError);
      expect(mockNotFoundGroup.getPermissions).toBeCalledTimes(0);
    });
  });
});
