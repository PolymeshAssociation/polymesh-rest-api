import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { RemoveTrustedClaimIssuersDto } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuersDto } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TrustedClaimIssuersController } from '~/compliance/trusted-claim-issuers.controller';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { testValues } from '~/test-utils/consts';
import { createMockTxResult, mockTrustedClaimIssuer } from '~/test-utils/mocks';
import { mockTrustedClaimIssuersServiceProvider } from '~/test-utils/service-mocks';

const { assetId } = testValues;

describe('TrustedClaimIssuersController', () => {
  const mockParams = { asset: assetId };
  let controller: TrustedClaimIssuersController;
  let mockService: DeepMocked<TrustedClaimIssuersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrustedClaimIssuersController],
      providers: [mockTrustedClaimIssuersServiceProvider],
    }).compile();

    mockService =
      mockTrustedClaimIssuersServiceProvider.useValue as DeepMocked<TrustedClaimIssuersService>;
    controller = module.get(TrustedClaimIssuersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTrustedClaimIssuers', () => {
    it('should return the list of all trusted Claim Issuers of an Asset', async () => {
      when(mockService.find).calledWith(assetId).mockResolvedValue([mockTrustedClaimIssuer]);

      const result = await controller.getTrustedClaimIssuers(mockParams);

      expect(result).toEqual({
        results: [
          {
            did: mockTrustedClaimIssuer.identity.did,
            trustedFor: mockTrustedClaimIssuer.trustedFor,
          },
        ],
      });
    });
  });

  describe('setTrustedClaimIssuers', () => {
    it('should accept SetTrustedClaimIssuersDto and set Asset trusted claim issuers', async () => {
      const testTxResult = createMockTxResult(
        TxTags.complianceManager.AddDefaultTrustedClaimIssuer
      );
      const mockPayload: SetTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      when(mockService.set).calledWith(assetId, mockPayload).mockResolvedValue(testTxResult);

      const result = await controller.setTrustedClaimIssuers(mockParams, mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('addTrustedClaimIssuers', () => {
    it('should accept SetTrustedClaimIssuersDto and add Asset trusted claim issuers', async () => {
      const testTxResult = createMockTxResult(
        TxTags.complianceManager.AddDefaultTrustedClaimIssuer
      );
      const mockPayload: SetTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      when(mockService.add).calledWith(assetId, mockPayload).mockResolvedValue(testTxResult);

      const result = await controller.addTrustedClaimIssuers(mockParams, mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });

  describe('removeTrustedClaimIssuers', () => {
    it('should accept RemoveTrustedClaimIssuersDto and remove trusted claim issuers for Asset', async () => {
      const testTxResult = createMockTxResult(
        TxTags.complianceManager.RemoveDefaultTrustedClaimIssuer
      );

      const mockPayload: RemoveTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      when(mockService.remove).calledWith(assetId, mockPayload).mockResolvedValue(testTxResult);

      const result = await controller.removeTrustedClaimIssuers(mockParams, mockPayload);

      expect(result).toEqual(testTxResult);
    });
  });
});
