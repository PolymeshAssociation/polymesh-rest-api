import { DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { ClaimsController } from '~/claims/claims.controller';
import { ClaimsService } from '~/claims/claims.service';
import { GetCustomClaimTypeDto } from '~/claims/dto/get-custom-claim-type.dto';
import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { CustomClaimTypeModel } from '~/claims/models/custom-claim-type.model';
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
    it('should call addClaimsOnDid method and return transaction data', async () => {
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

  describe('registerCustomClaimType', () => {
    const mockRegisterCustomClaimTypeDto = {
      name: 'CustomClaimType',
      description: 'Test',
      signer,
    };

    it('should call registerCustomClaimType method and return transaction data', async () => {
      mockClaimsService.registerCustomClaimType.mockResolvedValue({
        ...txResult,
        result: new BigNumber(123),
      });

      const result = await controller.registerCustomClaimType(mockRegisterCustomClaimTypeDto);

      expect(mockClaimsService.registerCustomClaimType).toHaveBeenCalledWith(
        mockRegisterCustomClaimTypeDto
      );
      expect(result).toEqual({ ...txResult, results: undefined });
    });
  });

  describe('getCustomClaimType', () => {
    const mockId = new BigNumber(1);
    const mockName = 'CustomClaimType';
    const mockResult = {
      id: mockId,
      name: mockName,
    };

    it('should return custom claim type by ID', async () => {
      mockClaimsService.getCustomClaimTypeById.mockResolvedValue(mockResult);

      const result = await controller.getCustomClaimType({ id: mockId } as GetCustomClaimTypeDto);

      expect(mockClaimsService.getCustomClaimTypeById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(new CustomClaimTypeModel(mockResult));
    });

    it('should return custom claim type by name', async () => {
      mockClaimsService.getCustomClaimTypeByName.mockResolvedValue(mockResult);

      const result = await controller.getCustomClaimType({
        name: mockName,
      } as GetCustomClaimTypeDto);

      expect(mockClaimsService.getCustomClaimTypeByName).toHaveBeenCalledWith(mockName);
      expect(result).toEqual(new CustomClaimTypeModel(mockResult));
    });

    it('should throw NotFoundException when custom claim type is not found', async () => {
      mockClaimsService.getCustomClaimTypeById.mockResolvedValue(null);
      mockClaimsService.getCustomClaimTypeByName.mockResolvedValue(null);

      await expect(
        controller.getCustomClaimType({ id: mockId } as GetCustomClaimTypeDto)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
