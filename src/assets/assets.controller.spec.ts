/* eslint-disable import/first */
const mockIsFungibleAsset = jest.fn();

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  CustomPermissionGroup,
  Identity,
  KnownAssetType,
  PermissionGroupType,
  SecurityIdentifierType,
  TxGroup,
} from '@polymeshassociation/polymesh-sdk/types';

import { MAX_CONTENT_HASH_LENGTH } from '~/assets/assets.consts';
import { AssetsController } from '~/assets/assets.controller';
import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { PermissionGroupWithPermissionsModel } from '~/assets/models/permission-group-with-permissions.model';
import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { MetadataService } from '~/metadata/metadata.service';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockAsset, MockAuthorizationRequest } from '~/test-utils/mocks';
import { MockAssetService, mockMetadataServiceProvider } from '~/test-utils/service-mocks';

const { signer, did, txResult, assetId } = testValues;

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isFungibleAsset: mockIsFungibleAsset,
}));

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = new MockAssetService();
  let mockMetadataService: DeepMocked<MetadataService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService, mockMetadataServiceProvider],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    mockMetadataService = mockMetadataServiceProvider.useValue as DeepMocked<MetadataService>;

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGlobalMetadataKeys', () => {
    it('should return all global metadata keys', async () => {
      const mockGlobalMetadata = [
        {
          name: 'Global Metadata',
          id: new BigNumber(1),
          specs: { description: 'Some description' },
        },
      ];
      mockMetadataService.findGlobalKeys.mockResolvedValue(mockGlobalMetadata);

      const result = await controller.getGlobalMetadataKeys();

      expect(result).toEqual(mockGlobalMetadata);
    });
  });

  describe('getDetails', () => {
    it('should return the details', async () => {
      const mockFullAgents = [createMock<Identity>({ did })];

      const mockAssetDetails = {
        assetType: KnownAssetType.EquityCommon,
        isDivisible: false,
        name: 'NAME',
        owner: {
          did,
        },
        totalSupply: new BigNumber(1),
        ticker: 'TICKER',
      };
      const mockIdentifiers = [
        {
          type: SecurityIdentifierType.Isin,
          value: 'US000000000',
        },
      ];
      const mockAssetIsFrozen = false;
      const mockAsset = new MockAsset();
      mockAsset.details.mockResolvedValue({ ...mockAssetDetails, fullAgents: mockFullAgents });
      mockAsset.getIdentifiers.mockResolvedValue(mockIdentifiers);
      mockAsset.isFrozen.mockResolvedValue(mockAssetIsFrozen);

      const mockFundingRound = 'Series A';
      mockAsset.currentFundingRound.mockResolvedValue(mockFundingRound);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockIsFungibleAsset.mockReturnValue(true);

      const result = await controller.getDetails({ asset: assetId });

      const mockResult = {
        ...mockAssetDetails,
        agents: [did],
        assetId: mockAsset.id,
        securityIdentifiers: mockIdentifiers,
        fundingRound: mockFundingRound,
        isFrozen: mockAssetIsFrozen,
      };

      expect(result).toEqual(mockResult);
    });
  });

  describe('getHolders', () => {
    const mockHolders = {
      data: [
        {
          identity: { did },
          balance: new BigNumber(1),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    it('should return the list of Asset holders', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders({ asset: assetId }, { size: new BigNumber(1) });
      const expectedResults = mockHolders.data.map(holder => {
        return { identity: holder.identity.did, balance: holder.balance };
      });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: expectedResults,
          total: new BigNumber(mockHolders.count),
          next: mockHolders.next,
        })
      );
    });

    it('should return the list of Asset holders from a start value', async () => {
      mockAssetsService.findHolders.mockResolvedValue(mockHolders);

      const result = await controller.getHolders(
        { asset: assetId },
        { size: new BigNumber(1), start: 'SOME_START_KEY' }
      );

      const expectedResults = mockHolders.data.map(holder => {
        return { identity: holder.identity.did, balance: holder.balance };
      });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: expectedResults,
          total: new BigNumber(mockHolders.count),
          next: mockHolders.next,
        })
      );
    });
  });

  describe('getDocuments', () => {
    const mockDocuments = {
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
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments({ asset: assetId }, { size: new BigNumber(1) });

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: new BigNumber(mockDocuments.count),
          next: mockDocuments.next,
        })
      );
    });

    it('should return the list of Asset documents from a start value', async () => {
      mockAssetsService.findDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.getDocuments(
        { asset: assetId },
        { size: new BigNumber(1), start: 'SOME_START_KEY' }
      );

      expect(result).toEqual(
        new PaginatedResultsModel({
          results: mockDocuments.data,
          total: new BigNumber(mockDocuments.count),
          next: mockDocuments.next,
        })
      );
    });
  });

  describe('setDocuments', () => {
    it('should call the service and return the results', async () => {
      const body = {
        signer: '0x6000',
        documents: [
          new AssetDocumentDto({
            name: 'TEST-DOC',
            uri: 'URI',
            contentHash: '0x'.padEnd(MAX_CONTENT_HASH_LENGTH, 'a'),
          }),
        ],
      };
      mockAssetsService.setDocuments.mockResolvedValue(txResult);

      const result = await controller.setDocuments({ asset: assetId }, body);
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.setDocuments).toHaveBeenCalledWith(assetId, body);
    });
  });

  describe('createAsset', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer: '0x6000',
        name: 'Ticker Corp',
        ticker: 'TICKER',
        isDivisible: false,
        assetType: KnownAssetType.EquityCommon,
      };
      mockAssetsService.createAsset.mockResolvedValue(txResult);

      const result = await controller.createAsset(input);
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.createAsset).toHaveBeenCalledWith(input);
    });
  });

  describe('issue', () => {
    it('should call the service and return the results', async () => {
      const amount = new BigNumber(1000);
      mockAssetsService.issue.mockResolvedValue(txResult);

      const result = await controller.issue({ asset: assetId }, { signer, amount });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.issue).toHaveBeenCalledWith(assetId, { signer, amount });
    });
  });

  describe('transferOwnership', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        ...txResult,
        result: mockAuthorization,
      };
      mockAssetsService.transferOwnership.mockResolvedValue(mockData);

      const body = { signer: '0x6000', target: '0x1000' };

      const result = await controller.transferOwnership({ asset: assetId }, body);

      expect(result).toEqual({
        ...processedTxResult,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
      });
      expect(mockAssetsService.transferOwnership).toHaveBeenCalledWith(assetId, body);
    });
  });

  describe('redeem', () => {
    it('should call the service and return the results', async () => {
      const amount = new BigNumber(1000);
      const from = new BigNumber(1);
      mockAssetsService.redeem.mockResolvedValue(txResult);

      const result = await controller.redeem({ asset: assetId }, { signer, amount, from });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.redeem).toHaveBeenCalledWith(assetId, { signer, amount, from });
    });
  });

  describe('freeze', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.freeze.mockResolvedValue(txResult);

      const result = await controller.freeze({ asset: assetId }, { signer });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.freeze).toHaveBeenCalledWith(assetId, { signer });
    });
  });

  describe('unfreeze', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.unfreeze.mockResolvedValue(txResult);

      const result = await controller.unfreeze({ asset: assetId }, { signer });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.unfreeze).toHaveBeenCalledWith(assetId, { signer });
    });
  });

  describe('controllerTransfer', () => {
    it('should call the service and return the results', async () => {
      const amount = new BigNumber(1000);
      const origin = new PortfolioDto({ id: new BigNumber(1), did: '0x1000' });

      mockAssetsService.controllerTransfer.mockResolvedValue(txResult);

      const result = await controller.controllerTransfer(
        { asset: assetId },
        { signer, origin, amount }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.controllerTransfer).toHaveBeenCalledWith(assetId, {
        signer,
        origin,
        amount,
      });
    });
  });

  describe('getOperationHistory', () => {
    it('should call the service and return the results', async () => {
      const mockAgent = {
        did: 'Ox6'.padEnd(66, '0'),
      };
      const mockHistory = [
        {
          blockNumber: new BigNumber(123),
          blockHash: 'blockHash',
          blockDate: new Date('07/11/2022'),
          eventIndex: new BigNumber(1),
        },
      ];
      const mockAgentOperations = [
        {
          identity: mockAgent,
          history: mockHistory,
        },
      ];
      mockAssetsService.getOperationHistory.mockResolvedValue(mockAgentOperations);

      const result = await controller.getOperationHistory({ asset: assetId });

      expect(result).toEqual([
        {
          did: mockAgent.did,
          history: mockHistory,
        },
      ]);
    });
  });

  describe('getRequiredMediators', () => {
    it('should call the service and return the results', async () => {
      const mockMediator = {
        did: 'Ox6'.padEnd(66, '0'),
      };

      mockAssetsService.getRequiredMediators.mockResolvedValue([mockMediator]);

      const result = await controller.getRequiredMediators({ asset: assetId });

      expect(result).toEqual({
        mediators: [mockMediator.did],
      });
    });
  });

  describe('addRequiredMediators', () => {
    it('should call the service and return the results', async () => {
      const mediators = ['someDid'];

      mockAssetsService.addRequiredMediators.mockResolvedValue(txResult);

      const result = await controller.addRequiredMediators(
        { asset: assetId },
        { signer, mediators }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.addRequiredMediators).toHaveBeenCalledWith(assetId, {
        signer,
        mediators,
      });
    });
  });

  describe('removeRequiredMediators', () => {
    it('should call the service and return the results', async () => {
      const mediators = ['someDid'];

      mockAssetsService.removeRequiredMediators.mockResolvedValue(txResult);

      const result = await controller.removeRequiredMediators(
        { asset: assetId },
        { signer, mediators }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.removeRequiredMediators).toHaveBeenCalledWith(assetId, {
        signer,
        mediators,
      });
    });
  });

  describe('preApprove', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.preApprove.mockResolvedValue(txResult);

      const result = await controller.preApprove({ asset: assetId }, { signer });

      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.preApprove).toHaveBeenCalledWith(assetId, {
        signer,
      });
    });
  });

  describe('removePreApproval', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.removePreApproval.mockResolvedValue(txResult);

      const result = await controller.removePreApproval({ asset: assetId }, { signer });

      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.removePreApproval).toHaveBeenCalledWith(assetId, {
        signer,
      });
    });
  });

  describe('linkTicker', () => {
    it('should call the service and return the results', async () => {
      const ticker = 'TICKER';
      mockAssetsService.linkTickerToAsset.mockResolvedValue(txResult);

      const result = await controller.linkTicker({ asset: assetId }, { signer, ticker });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.linkTickerToAsset).toHaveBeenCalledWith(assetId, { signer, ticker });
    });
  });

  describe('unlinkTicker', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.unlinkTickerFromAsset.mockResolvedValue(txResult);

      const result = await controller.unlinkTicker({ asset: assetId }, { signer });
      expect(result).toEqual(processedTxResult);
      expect(mockAssetsService.unlinkTickerFromAsset).toHaveBeenCalledWith(assetId, { signer });
    });
  });

  describe('createGroup', () => {
    it('should call the service and return the results', async () => {
      const mockGroup = createMock<CustomPermissionGroup>({ id: 'someId' });

      mockAssetsService.createPermissionGroup.mockResolvedValue({ ...txResult, result: mockGroup });

      const result = await controller.createGroup(
        { asset: assetId },
        { signer, transactionGroups: [TxGroup.Distribution] }
      );

      expect(result).toEqual({ ...processedTxResult, id: mockGroup.id });
    });
  });

  describe('getPermissionGroupsWithPermissions', () => {
    it('should call the service and return the results', async () => {
      const mockResult = [
        { id: new BigNumber(1), permissions: [] },
        { type: PermissionGroupType.Full, permissions: [] },
      ];
      mockAssetsService.getPermissionGroupsWithPermissions.mockResolvedValue(mockResult);

      const result = await controller.getPermissionGroupsWithPermissions({ asset: assetId });

      expect(result).toEqual(
        new ResultsModel({
          results: mockResult.map(
            group =>
              new PermissionGroupWithPermissionsModel(
                group as unknown as PermissionGroupWithPermissionsModel
              )
          ),
        })
      );
    });
  });

  describe('inviteAgent', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        ...txResult,
        result: mockAuthorization,
      };
      mockAssetsService.inviteAgentToGroup.mockResolvedValue(mockData);

      const result = await controller.inviteAgent(
        { asset: assetId },
        { signer, target: '0x1000', permissions: new BigNumber(1) }
      );

      expect(result).toEqual({
        ...processedTxResult,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
      });
    });
  });

  describe('removeAgent', () => {
    it('should call the service and return the results', async () => {
      mockAssetsService.removeAgentFromAsset.mockResolvedValue(txResult);

      const result = await controller.removeAgent({ asset: assetId }, { signer, target: '0x1000' });

      expect(result).toEqual(processedTxResult);
    });
  });
});
