/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { MockCorporateActionDefaults } from '~/corporate-actions/mocks/corporate-action-defaults.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { MockSecurityToken } from '~/test-utils/mocks';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;

  const mockAssetsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateActionsService, AssetsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDefaultsByTicker', () => {
    it('should return the Corporate Action defaults for an Asset', async () => {
      const mockCorporateActionDefaults = new MockCorporateActionDefaults();

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.corporateActions.getDefaults.mockResolvedValue(mockCorporateActionDefaults);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findDefaultsByTicker('TICKER');

      expect(result).toEqual(mockCorporateActionDefaults);
    });
  });

  describe('findDistributionsByTicker', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.corporateActions.distributions.get.mockResolvedValue(mockDistributions);

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findDistributionsByTicker('TICKER');

      expect(result).toEqual(mockDistributions);
    });
  });

  describe('findDistribution', () => {
    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if the Dividend Distribution does not exist', () => {
      it('should throw a NotFoundException', async () => {
        const mockSecurityToken = new MockSecurityToken();
        mockSecurityToken.corporateActions.distributions.getOne.mockImplementation(() => {
          throw new PolymeshError({
            code: ErrorCode.DataUnavailable,
            message: 'The Dividend Distribution does not exist',
          });
        });
        mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findDistribution('TICKER', new BigNumber('1'));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('foo');

        const mockSecurityToken = new MockSecurityToken();
        mockSecurityToken.corporateActions.distributions.getOne.mockImplementation(() => {
          throw expectedError;
        });

        mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

        let error;
        try {
          await service.findDistribution('TICKER', new BigNumber('1'));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return a specific Dividend Distribution associated with an Asset', async () => {
        const mockDistributions = new MockDistributionWithDetails();

        const mockSecurityToken = new MockSecurityToken();
        mockSecurityToken.corporateActions.distributions.getOne.mockResolvedValue(
          mockDistributions
        );

        mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

        const result = await service.findDistribution('TICKER', new BigNumber('1'));

        expect(result).toEqual(mockDistributions);
      });
    });
  });
});
