import { DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { ClaimsController } from '~/claims/claims.controller';
import { ClaimsService } from '~/claims/claims.service';
import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { testValues } from '~/test-utils/consts';
import { mockClaimsServiceProvider } from '~/test-utils/service-mocks';

const { did, txResult, signer } = testValues;

describe('ClaimsController', () => {
  let controller: ClaimsController;
  let mockClaimsService: DeepMocked<ClaimsService>;

  const mockPayload: ModifyClaimsDto = {
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
    const module = await Test.createTestingModule({
      controllers: [ClaimsController],
      providers: [mockClaimsServiceProvider, mockPolymeshLoggerProvider],
    }).compile();

    mockClaimsService = mockClaimsServiceProvider.useValue as DeepMocked<ClaimsService>;
    controller = module.get<ClaimsController>(ClaimsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addClaims', () => {
    it('should call addClaimsToDid method and return transaction data', async () => {
      mockClaimsService.addClaimsOnDid.mockResolvedValue({ ...txResult, result: undefined });

      const result = await controller.addClaims(mockPayload);

      expect(mockClaimsService.addClaimsOnDid).toHaveBeenCalledWith(mockPayload);

      expect(result).toEqual({ ...txResult, results: undefined });
    });
  });

  describe('editClaims', () => {
    it('should call editClaimsOnDid method and return transaction data', async () => {
      mockClaimsService.editClaimsOnDid.mockResolvedValue({ ...txResult, result: undefined });

      const result = await controller.editClaims(mockPayload);

      expect(mockClaimsService.editClaimsOnDid).toHaveBeenCalledWith(mockPayload);

      expect(result).toEqual({ ...txResult, results: undefined });
    });
  });

  describe('revokeClaims', () => {
    it('should call revokeClaimsFromDid method and return transaction data', async () => {
      mockClaimsService.revokeClaimsFromDid.mockResolvedValue({ ...txResult, result: undefined });

      const result = await controller.revokeClaims(mockPayload);

      expect(mockClaimsService.revokeClaimsFromDid).toHaveBeenCalledWith(mockPayload);

      expect(result).toEqual({ ...txResult, results: undefined });
    });
  });
});
