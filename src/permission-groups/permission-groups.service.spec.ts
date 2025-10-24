/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
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
import { AssignAgentToGroupDto } from '~/permission-groups/dto/assign-agent-to-group.dto';
import { CheckPermissionsDto } from '~/permission-groups/dto/check-permissions.dto';
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

  describe('findOne', () => {
    let findAssetSpy: jest.SpyInstance;
    let mockAsset: MockAsset;

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      mockAsset = new MockAsset();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findAssetSpy.mockResolvedValue(mockAsset as any);
    });

    it('should return a custom permission group', async () => {
      const mockCustomGroup = createMock<CustomPermissionGroup>({
        id: new BigNumber(1),
        exists: jest.fn().mockResolvedValue(true),
      });

      mockAsset.permissions.getGroup.mockResolvedValue(mockCustomGroup);

      const result = await service.findOne(assetId, new BigNumber(1));

      expect(result).toEqual(mockCustomGroup);

      expect(mockAsset.permissions.getGroup).toHaveBeenCalled();
    });

    it('should throw an error if the custom permission group does not exist', async () => {
      const mockNotFoundGroup = createMock<CustomPermissionGroup>({
        exists: jest.fn().mockResolvedValue(false),
      });
      mockAsset.permissions.getGroup.mockResolvedValue(mockNotFoundGroup);

      await expect(service.findOne(assetId, new BigNumber(1))).rejects.toThrow(AppNotFoundError);
    });
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
        transactionGroups: [TxGroup.CapitalDistribution],
      });

      expect(result).toEqual({
        result: mockPermissionGroup,
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockAsset.permissions.createGroup,
        expect.objectContaining({
          permissions: {
            transactionGroups: [TxGroup.CapitalDistribution],
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
        transactionGroups: [TxGroup.CapitalDistribution],
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

  describe('assignAgentToGroup', () => {
    let mockAsset: MockAsset;
    let findAssetSpy: jest.SpyInstance;
    const transaction = {
      blockHash: '0x1',
      txHash: '0x2',
      blockNumber: new BigNumber(1),
      tag: TxTags.externalAgents.ChangeGroup,
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

    it('should assign an agent to a permission group by id', async () => {
      const setGroupMock = jest.fn();
      const setGroupProcedure = setGroupMock as unknown as Identity['assetPermissions']['setGroup'];
      const mockIdentity = createMock<Identity>({
        did,
        assetPermissions: {
          setGroup: setGroupProcedure,
        },
      });
      const mockGroup = createMock<CustomPermissionGroup>();
      const mockTransaction = new MockTransaction(transaction);
      const dto: AssignAgentToGroupDto = {
        target: did,
        permissions: new BigNumber(1),
        signer,
      };

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockAsset.permissions.getGroup.mockResolvedValue(mockGroup);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.assignAgentToGroup(assetId, dto);

      expect(result).toEqual({ transactions: [mockTransaction] });
      expect(findAssetSpy).toHaveBeenCalledWith(assetId);
      expect(mockAsset.permissions.getGroup).toHaveBeenCalledWith({ id: dto.permissions });
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        setGroupProcedure,
        { group: mockGroup },
        expect.objectContaining({ signer })
      );
    });

    it('should assign an agent using transaction groups permissions', async () => {
      const setGroupMock = jest.fn();
      const setGroupProcedure = setGroupMock as unknown as Identity['assetPermissions']['setGroup'];
      const mockIdentity = createMock<Identity>({
        did,
        assetPermissions: {
          setGroup: setGroupProcedure,
        },
      });
      const mockTransaction = new MockTransaction(transaction);
      const transactionGroups = [TxGroup.CapitalDistribution];
      const dto: AssignAgentToGroupDto = {
        target: did,
        permissions: {
          transactionGroups,
        } as unknown as AssignAgentToGroupDto['permissions'],
        signer,
      };

      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

      const result = await service.assignAgentToGroup(assetId, dto);

      expect(result).toEqual({ transactions: [mockTransaction] });
      expect(mockAsset.permissions.getGroup).not.toHaveBeenCalled();
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        setGroupProcedure,
        {
          group: expect.objectContaining({
            asset: assetId,
            transactionGroups,
          }),
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

  describe('abdicateAgent', () => {
    it('should submit a transaction for an Identity to abdicate its permissions', async () => {
      const mockAsset = new MockAsset();
      const waive = jest.fn() as unknown as Identity['assetPermissions']['waive'];
      const mockIdentity = createMock<Identity>({
        assetPermissions: {
          waive,
        },
      });

      jest.spyOn(mockAssetsService, 'findOne').mockResolvedValue(mockAsset as unknown as Asset);
      mockIdentitiesService.findOne.mockResolvedValue(mockIdentity);
      const abdicateResult = { transactions: [] };
      mockTransactionsService.submit.mockResolvedValue(abdicateResult);

      const result = await service.abdicateAgent(assetId, { signer, identity: did });

      expect(result).toEqual(abdicateResult);
      expect(mockAssetsService.findOne).toHaveBeenCalledWith(assetId);
      expect(mockIdentitiesService.findOne).toHaveBeenCalledWith(did);
      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        waive,
        { asset: assetId },
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
      const mockCustomPermissions = { transactionGroups: [TxGroup.CapitalDistribution] };
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

  describe('modifyPermissions', () => {
    let mockPermissionGroup: CustomPermissionGroup;
    let mockTransaction: MockTransaction;

    beforeEach(() => {
      mockPermissionGroup = createMock<CustomPermissionGroup>();
      service.findOne = jest.fn().mockResolvedValue(mockPermissionGroup);
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.externalAgents.SetGroupPermissions,
      };
      mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({
        transactions: [mockTransaction],
      });
    });

    it('should set the permissions of a permission group with the given transaction group permissions', async () => {
      const result = await service.modifyPermissions(assetId, new BigNumber(1), {
        signer,
        transactionGroups: [TxGroup.CapitalDistribution],
      });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPermissionGroup.setPermissions,
        expect.objectContaining({
          permissions: {
            transactionGroups: [TxGroup.CapitalDistribution],
          },
        }),
        expect.objectContaining({ signer })
      );
    });

    it('should set the permissions of a permission group with the given transaction permissions', async () => {
      const transactions = new TransactionPermissionsDto({
        values: [TxTags.asset.RegisterUniqueTicker],
        type: PermissionType.Include,
        exceptions: [TxTags.asset.AcceptTickerTransfer],
      });

      const result = await service.modifyPermissions(assetId, new BigNumber(1), {
        signer,
        transactions,
      });

      expect(result).toEqual({
        transactions: [mockTransaction],
      });

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPermissionGroup.setPermissions,
        expect.objectContaining({
          permissions: {
            transactions,
          },
        }),
        expect.objectContaining({ signer })
      );
    });
  });

  describe('checkPermissions', () => {
    let findAssetSpy: jest.SpyInstance;
    let findIdentitySpy: jest.SpyInstance;

    beforeEach(() => {
      findAssetSpy = jest.spyOn(mockAssetsService, 'findOne');
      findIdentitySpy = jest.spyOn(mockIdentitiesService, 'findOne');
    });

    it('should check permissions for an identity', async () => {
      const mockAsset = createMock<Asset>({ id: assetId });
      const mockIdentity = createMock<Identity>({
        did,
        assetPermissions: {
          checkPermissions: jest.fn().mockResolvedValue({
            missingPermissions: [TxTags.asset.Issue],
            result: true,
            message: 'You are not authorized to perform this action',
          }),
        },
      });

      const dto: CheckPermissionsDto = {
        target: did,
        transactions: [TxTags.asset.Issue, TxTags.asset.AddDocuments],
      };

      findAssetSpy.mockResolvedValue(mockAsset);
      findIdentitySpy.mockResolvedValue(mockIdentity);

      const result = await service.checkPermissions(assetId, dto);

      expect(result).toEqual({
        missingPermissions: [TxTags.asset.Issue],
        result: true,
        message: 'You are not authorized to perform this action',
      });
    });
  });
});
