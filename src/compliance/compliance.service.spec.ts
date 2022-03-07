/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ClaimType, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { ComplianceService } from '~/compliance/compliance.service';
import { MockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { MockAsset, MockTransactionQueue } from '~/test-utils/mocks';
import { MockAssetService, MockRelayerAccountsService } from '~/test-utils/service-mocks';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('ComplianceService', () => {
  let service: ComplianceService;
  const mockRelayerAccountsService = new MockRelayerAccountsService();
  const mockAssetsService = new MockAssetService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayerAccountsService, AssetsService, ComplianceService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get(ComplianceService);

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
      const transactions = [
        {
          blockHash: '0x1',
          txHash: '0x2',
          blockNumber: new BigNumber(1),
          tag: TxTags.complianceManager.AddComplianceRequirement,
        },
      ];
      const mockQueue = new MockTransactionQueue(transactions);
      const address = 'address';
      mockAsset.compliance.requirements.set.mockResolvedValue(mockQueue);
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
      mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

      const body = { requirements: [], signer: '0x6000', asSetAssetRequirementsParams: jest.fn() };

      const result = await service.setRequirements('TICKER', body);

      expect(result).toEqual({
        result: undefined,
        transactions: [
          {
            blockHash: '0x1',
            transactionHash: '0x2',
            blockNumber: new BigNumber(1),
            transactionTag: TxTags.complianceManager.AddComplianceRequirement,
          },
        ],
      });
    });
  });
});
