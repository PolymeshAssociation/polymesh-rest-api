import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimData, ClaimType, ResultSet, TxTags } from '@polymeshassociation/polymesh-sdk/types';

import { ClaimsService } from '~/claims/claims.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { mockTransactionsProvider, MockTransactionsService } from '~/test-utils/service-mocks';

describe('ClaimsService', () => {
  let claimsService: ClaimsService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockTransactionsService: MockTransactionsService;

  const { did, signer } = testValues;

  const mockModifyClaimsArgs = {
    claims: [
      {
        target: did,
        claim: {
          type: ClaimType.Accredited,
        },
      },
    ],
    signer,
  };

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [ClaimsService, mockTransactionsProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    claimsService = module.get<ClaimsService>(ClaimsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    mockTransactionsService = mockTransactionsProvider.useValue;
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(claimsService).toBeDefined();
  });

  describe('findIssuedByDid', () => {
    it('should return the issued Claims', async () => {
      const claimsResult = {
        data: [],
        next: null,
        count: new BigNumber(0),
      } as ResultSet<ClaimData>;
      mockPolymeshApi.claims.getIssuedClaims.mockResolvedValue(claimsResult);
      const result = await claimsService.findIssuedByDid('did');
      expect(result).toBe(claimsResult);
    });
  });

  describe('findAssociatedByDid', () => {
    it('should return the associated Claims', async () => {
      const mockAssociatedClaims = [
        {
          issuedAt: '2020-08-21T16:36:55.000Z',
          expiry: null,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: 'Identity',
              value: '0x9'.padEnd(66, '1'),
            },
          },
          target: {
            did,
          },
          issuer: {
            did: '0x6'.padEnd(66, '1'),
          },
        },
      ];

      const mockIdentitiesWithClaims = {
        data: [
          {
            identity: {
              did,
            },
            claims: mockAssociatedClaims,
          },
        ],
        next: null,
        count: new BigNumber(1),
      };
      mockPolymeshApi.claims.getIdentitiesWithClaims.mockResolvedValue(mockIdentitiesWithClaims);
      const result = await claimsService.findAssociatedByDid(did);
      expect(result).toStrictEqual({
        data: mockAssociatedClaims,
        next: null,
        count: new BigNumber(1),
      });
    });
  });

  describe('addClaimsToDid', () => {
    it('should run a addClaims procedure and return the queue results', async () => {
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddClaim,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      mockTransactionsService.submit.mockResolvedValue(mockTransaction);

      const result = await claimsService.addClaimsOnDid(mockModifyClaimsArgs);

      expect(result).toBe(mockTransaction);

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.claims.addClaims,
        { claims: mockModifyClaimsArgs.claims },
        { signer: mockModifyClaimsArgs.signer }
      );
    });
  });

  describe('editClaimsToDid', () => {
    it('should run a editClaims procedure and return the queue results', async () => {
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.AddClaim, // hmm thought it would be edit claim
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      mockTransactionsService.submit.mockResolvedValue(mockTransaction);

      const result = await claimsService.editClaimsOnDid(mockModifyClaimsArgs);

      expect(result).toBe(mockTransaction);

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.claims.editClaims,
        { claims: mockModifyClaimsArgs.claims },
        { signer: mockModifyClaimsArgs.signer }
      );
    });
  });

  describe('revokeClaimsFromDid', () => {
    it('should run a revokeClaims procedure and return the queue results', async () => {
      const mockTransactions = {
        blockHash: '0x1',
        txHash: '0x2',
        blockNumber: new BigNumber(1),
        tag: TxTags.identity.RevokeClaim,
      };
      const mockTransaction = new MockTransaction(mockTransactions);

      mockTransactionsService.submit.mockResolvedValue(mockTransaction);

      const result = await claimsService.revokeClaimsFromDid(mockModifyClaimsArgs);

      expect(result).toBe(mockTransaction);

      expect(mockTransactionsService.submit).toHaveBeenCalledWith(
        mockPolymeshApi.claims.revokeClaims,
        { claims: mockModifyClaimsArgs.claims },
        { signer: mockModifyClaimsArgs.signer }
      );
    });
  });

  describe('findCddClaimsByDid', () => {
    const date = new Date().toISOString();
    const mockCddClaims = [
      {
        target: did,
        issuer: did,
        issuedAt: date,
        expiry: date,
        claim: {
          type: 'Accredited',
          scope: {
            type: 'Identity',
            value: did,
          },
        },
      },
    ];

    it('should return a list of CDD Claims for given DID', async () => {
      mockPolymeshApi.claims.getCddClaims.mockResolvedValue(mockCddClaims);

      const result = await claimsService.findCddClaimsByDid(did);

      expect(result).toBe(mockCddClaims);

      expect(mockPolymeshApi.claims.getCddClaims).toHaveBeenCalledWith({
        target: did,
        includeExpired: true,
      });
    });

    it('should return a list of CDD Claims for given DID without including expired claims', async () => {
      mockPolymeshApi.claims.getCddClaims.mockResolvedValue(mockCddClaims);

      const result = await claimsService.findCddClaimsByDid(did, false);

      expect(result).toBe(mockCddClaims);

      expect(mockPolymeshApi.claims.getCddClaims).toHaveBeenCalledWith({
        target: did,
        includeExpired: false,
      });
    });
  });
});
