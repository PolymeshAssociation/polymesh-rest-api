/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { MockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { MockAsset, MockTransaction } from '~/test-utils/mocks';
import { MockAssetService, mockTransactionsProvider } from '~/test-utils/service-mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('ComplianceRequirementsService', () => {
  let service: ComplianceRequirementsService;
  const mockAssetsService = new MockAssetService();
  const mockTransactionsService = mockTransactionsProvider.useValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService, ComplianceRequirementsService, mockTransactionsProvider],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get(ComplianceRequirementsService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findComplianceRequirements', () => {
    it('should return the list of Asset compliance requirements', async () => {
      const mockRequirements = new MockComplianceRequirements();

      const mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      mockAsset.compliance.requirements.get.mockResolvedValue(mockRequirements);

      const result = await service.findComplianceRequirements('TICKER');

      expect(result).toEqual(mockRequirements);
    });
  });

  describe('findTrustedClaimIssuers', () => {
    it('should return the list of trusted Claim Issuers of an Asset', async () => {
      const mockClaimIssuers = [
        {
          did: 'Ox6'.padEnd(66, '0'),
          trustedFor: [ClaimType.Accredited, ClaimType.InvestorUniqueness],
        },
      ];

      const mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      mockAsset.compliance.trustedClaimIssuers.get.mockResolvedValue(mockClaimIssuers);

      const result = await service.findTrustedClaimIssuers('TICKER');

      expect(result).toEqual(mockClaimIssuers);
    });
  });

  describe('setRequirements', () => {
    it('should run a set rules procedure and return the queue data', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.AddComplianceRequirement,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { requirements: [], signer: '0x6000', asSetAssetRequirementsParams: jest.fn() };

      const result = await service.setRequirements('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('pauseRequirements', () => {
    it('should run a pause requirements procedure and return the queue data', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.PauseAssetCompliance,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { signer: '0x6000' };

      const result = await service.pauseRequirements('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('unpauseRequirements', () => {
    it('should run a unpause requirements procedure and return the queue data', async () => {
      const mockAsset = new MockAsset();
      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.ResumeAssetCompliance,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { signer: '0x6000' };

      const result = await service.unpauseRequirements('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('deleteRequirement', () => {
    it('should run the delete Requirement procedure and return the queue data', async () => {
      const requirementId = new BigNumber(1);
      const mockAsset = new MockAsset();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.RemoveComplianceRequirement,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { signer: '0x6000' };

      const result = await service.deleteOne('TICKER', requirementId, body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('deleteRequirements', () => {
    it('should run the delete all Requirements procedure and return the queue data', async () => {
      const mockAsset = new MockAsset();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.ResetAssetCompliance,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { signer: '0x6000' };

      const result = await service.deleteAll('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('addRequirement', () => {
    it('should run the add Requirement procedure and return the queue data', async () => {
      const mockAsset = new MockAsset();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.AddComplianceRequirement,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { conditions: [], signer: '0x6000' };

      const result = await service.add('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });

  describe('editRequirement', () => {
    it('should run the modify Requirements procedure and return the queue data', async () => {
      const requirementId = new BigNumber(1);
      const mockAsset = new MockAsset();

      const transaction = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.complianceManager.ChangeComplianceRequirement,
      };

      const mockTransaction = new MockTransaction(transaction);
      mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const body = { conditions: [], signer: '0x6000' };

      const result = await service.modify('TICKER', requirementId, body);

      expect(result).toEqual({
        result: undefined,
        transactions: [mockTransaction],
      });
    });
  });
});
