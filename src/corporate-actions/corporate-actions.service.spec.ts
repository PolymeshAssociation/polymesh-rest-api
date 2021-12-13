/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, TargetTreatment, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { MockSecurityToken, MockTransactionQueue } from '~/test-utils/mocks';
import { MockAssetService, MockRelayerAccountsService } from '~/test-utils/service-mocks';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;

  const mockAssetsService = new MockAssetService();

  const mockRelayerAccountsService = new MockRelayerAccountsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateActionsService, AssetsService, RelayerAccountsService],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .overrideProvider(RelayerAccountsService)
      .useValue(mockRelayerAccountsService)
      .compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDefaultConfigByTicker', () => {
    it('should return the Corporate Action Default Config for an Asset', async () => {
      const mockCorporateActionDefaultConfig = new MockCorporateActionDefaultConfig();

      const mockSecurityToken = new MockSecurityToken();
      mockSecurityToken.corporateActions.getDefaultConfig.mockResolvedValue(
        mockCorporateActionDefaultConfig
      );

      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);

      const result = await service.findDefaultConfigByTicker('TICKER');

      expect(result).toEqual(mockCorporateActionDefaultConfig);
    });
  });

  describe('updateDefaultConfigByTicker', () => {
    let mockSecurityToken: MockSecurityToken;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockSecurityToken = new MockSecurityToken();
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);
    });

    describe('if there is an error while modifying the Corporate Action Default Config', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('New targets are the same as the current ones');
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          targets: {
            treatment: TargetTreatment.Exclude,
            identities: [],
          },
        };
        mockSecurityToken.corporateActions.setDefaultConfig.mockImplementation(() => {
          throw expectedError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error = null;
        try {
          await service.updateDefaultConfigByTicker(ticker, body);
        } catch (err) {
          error = err;
        }
        expect(error).toEqual(expectedError);
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
    describe('otherwise', () => {
      it('should run a setDefaultConfig procedure and return the queue data', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.corporateAction.SetDefaultWithholdingTax,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        mockSecurityToken.corporateActions.setDefaultConfig.mockResolvedValue(mockQueue);

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          defaultTaxWithholding: new BigNumber('25'),
        };
        const result = await service.updateDefaultConfigByTicker(ticker, body);

        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.corporateAction.SetDefaultWithholdingTax,
            },
          ],
        });
        expect(mockSecurityToken.corporateActions.setDefaultConfig).toHaveBeenCalledWith(
          { defaultTaxWithholding: new BigNumber('25') },
          { signer: address }
        );
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
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
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Dividend Distribution does not exist',
        };
        mockSecurityToken.corporateActions.distributions.getOne.mockImplementation(() => {
          throw mockError;
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

  describe('removeByTicker', () => {
    let mockSecurityToken: MockSecurityToken;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockSecurityToken = new MockSecurityToken();
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);
    });

    describe('if there is an error while deleting a Corporate Action', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error("The Corporate Action doesn't exist");

        mockSecurityToken.corporateActions.remove.mockImplementation(() => {
          throw expectedError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error = null;
        try {
          await service.remove(ticker, new BigNumber(1), '0x6'.padEnd(66, '0'));
        } catch (err) {
          error = err;
        }
        expect(error).toEqual(expectedError);
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
    describe('otherwise', () => {
      it('should run a remove procedure and return the delete the Corporate Action', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.corporateAction.RemoveCa,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockSecurityToken.corporateActions.remove.mockResolvedValue(mockQueue);

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.remove(ticker, new BigNumber(1), '0x6'.padEnd(66, '0'));

        expect(result).toEqual({
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.corporateAction.RemoveCa,
            },
          ],
        });
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
  });

  describe('payDividends', () => {
    const body = {
      signer: '0x6'.padEnd(66, '0'),
      targets: ['0x6'.padEnd(66, '1')],
    };
    describe('if there is an error', () => {
      const errors = [
        [
          {
            code: ErrorCode.UnmetPrerequisite,
            message: "The Distribution's payment date hasn't been reached",
            data: { paymentDate: new Date() },
          },
          BadRequestException,
        ],
        [
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The Distribution has already expired',
            data: {
              expiryDate: new Date(),
            },
          },
          BadRequestException,
        ],
        [
          {
            code: ErrorCode.UnmetPrerequisite,
            message:
              'Some of the supplied Identities have already either been paid or claimed their share of the Distribution',
            data: {
              targets: body.targets,
            },
          },
          BadRequestException,
        ],
        [
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'Some of the supplied Identities are not included in this Distribution',
            data: {
              excluded: body.targets,
            },
          },
          BadRequestException,
        ],
      ];
      it('should pass the error along the chain', async () => {
        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        errors.forEach(async ([polymeshError, httpException]) => {
          const distubutionWithDetails = new MockDistributionWithDetails();
          distubutionWithDetails.distribution.pay.mockImplementation(() => {
            throw polymeshError;
          });
          mockIsPolymeshError.mockReturnValue(true);

          const findDistributionSpy = jest.spyOn(service, 'findDistribution');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          findDistributionSpy.mockResolvedValue(distubutionWithDetails as any);

          let error;
          try {
            await service.payDividends('TICKER', new BigNumber('1'), body);
          } catch (err) {
            error = err;
          }
          expect(error).toBeInstanceOf(httpException);

          mockIsPolymeshError.mockReset();
          findDistributionSpy.mockRestore();
        });
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.capitalDistribution.PushBenefit,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        const distubutionWithDetails = new MockDistributionWithDetails();
        distubutionWithDetails.distribution.pay.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distubutionWithDetails as any);

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.payDividends('TICKER', new BigNumber(1), body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.capitalDistribution.PushBenefit,
            },
          ],
        });
        expect(distubutionWithDetails.distribution.pay).toHaveBeenCalledWith(
          {
            targets: body.targets,
          },
          {
            signer: address,
          }
        );
        findDistributionSpy.mockRestore();
      });
    });
  });
});
