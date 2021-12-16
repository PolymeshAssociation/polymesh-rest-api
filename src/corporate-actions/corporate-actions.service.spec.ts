import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ErrorCode, TargetTreatment, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { MockDistribution } from '~/corporate-actions/mocks/dividend-distribution.mock';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { MockSecurityToken, MockTransactionQueue } from '~/test-utils/mocks';
import { MockAssetService, MockRelayerAccountsService } from '~/test-utils/service-mocks';

type ErrorCase = [string, Record<string, unknown>, unknown];

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

  describe('createDividendDistribution', () => {
    let mockSecurityToken: MockSecurityToken;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockSecurityToken = new MockSecurityToken();
      mockAssetsService.findOne.mockResolvedValue(mockSecurityToken);
    });

    describe('distributions.configureDividendDistribution errors', () => {
      const cases: ErrorCase[] = [
        [
          "Origin Portfolio doesn't exists",
          {
            code: ErrorCode.DataUnavailable,
            message: "The origin Portfolio doesn't exist",
          },
          NotFoundException,
        ],
        [
          'The Distribution is expired',
          {
            code: ErrorCode.InsufficientBalance,
            message:
              "The origin Portfolio's free balance is not enough to cover the Distribution amount",
            data: {
              free: new BigNumber(1),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Using the Corporate Action Asset as the payout currency',
          {
            code: ErrorCode.ValidationError,
            message: 'Cannot distribute Dividends using the Security Token as currency',
          },
          BadRequestException,
        ],
        [
          'Payment date has already passed',
          {
            code: ErrorCode.ValidationError,
            message: 'Payment date must be in the future',
          },
          BadRequestException,
        ],
        [
          'Distribution expires before the payment date',
          {
            code: ErrorCode.ValidationError,
            message: 'Expiry date must be after payment date',
          },
          BadRequestException,
        ],
        [
          'Declaration date is not in the past',
          {
            code: ErrorCode.ValidationError,
            message: 'Declaration date must be in the past',
          },
          BadRequestException,
        ],
        [
          'Payment date before Checkpoint date',
          {
            code: ErrorCode.ValidationError,
            message: 'Payment date must be after the Checkpoint date',
          },
          BadRequestException,
        ],
        [
          'Corporate Action expires before Checkpoint Date',
          {
            code: ErrorCode.ValidationError,
            message: 'Expiry date must be after the Checkpoint date',
          },
          BadRequestException,
        ],
        [
          'Checkpoint Date has already passed',
          {
            code: ErrorCode.ValidationError,
            message: 'Checkpoint date must be in the future',
          },
          BadRequestException,
        ],
        [
          "Checkpoint doesn't exist",
          {
            code: ErrorCode.DataUnavailable,
            message: "Checkpoint doesn't exist",
          },
          NotFoundException,
        ],
        [
          "Checkpoint Schedule doesn't exist",
          {
            code: ErrorCode.DataUnavailable,
            message: "Checkpoint Schedule doesn't exist",
          },
          NotFoundException,
        ],
      ];
      test.each(cases)('%s', async (_, polymeshError, httpException) => {
        const mockDate = new Date();
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          description: 'Corporate Action description',
          checkpoint: mockDate,
          originPortfolio: new BigNumber(0),
          currency: 'TICKER',
          perShare: new BigNumber(2),
          maxAmount: new BigNumber(1000),
          paymentDate: mockDate,
        };
        mockSecurityToken.corporateActions.distributions.configureDividendDistribution.mockImplementation(
          () => {
            throw polymeshError;
          }
        );

        mockIsPolymeshError.mockReturnValue(true);

        let error = null;
        try {
          await service.createDividendDistribution(ticker, body);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(httpException);
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
    describe('otherwise', () => {
      it('should run a configureDividendDistribution procedure and return the created Dividend Distribution', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.corporateAction.InitiateCorporateAction,
          },
          {
            blockHash: '0x3',
            txHash: '0x4',
            tag: TxTags.capitalDistribution.Distribute,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        const mockDistribution = new MockDistribution();
        mockQueue.run.mockResolvedValue(mockDistribution);
        mockSecurityToken.corporateActions.distributions.configureDividendDistribution.mockResolvedValue(
          mockQueue
        );

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const mockDate = new Date();
        const body = {
          signer: '0x6'.padEnd(66, '0'),
          description: 'Corporate Action description',
          checkpoint: mockDate,
          originPortfolio: new BigNumber(0),
          currency: 'TICKER',
          perShare: new BigNumber(2),
          maxAmount: new BigNumber(1000),
          paymentDate: mockDate,
        };
        const result = await service.createDividendDistribution(ticker, body);

        expect(result).toEqual({
          result: mockDistribution,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.corporateAction.InitiateCorporateAction,
            },
            {
              blockHash: '0x3',
              transactionHash: '0x4',
              transactionTag: TxTags.capitalDistribution.Distribute,
            },
          ],
        });
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
  });

  describe('remove', () => {
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

    describe('distribution.pay errors', () => {
      const cases: ErrorCase[] = [
        [
          "The Distribution's date has not been reached",
          {
            code: ErrorCode.UnmetPrerequisite,
            message: "The Distribution's payment date hasn't been reached",
            data: { paymentDate: new Date() },
          },
          UnprocessableEntityException,
        ],
        [
          'The Distribution is expired',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The Distribution has already expired',
            data: {
              expiryDate: new Date(),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Identities already claimed their Distribution',
          {
            code: ErrorCode.UnmetPrerequisite,
            message:
              'Some of the supplied Identities have already either been paid or claimed their share of the Distribution',
            data: {
              targets: body.targets,
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Supplied Identities are not included',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'Some of the supplied Identities are not included in this Distribution',
            data: {
              excluded: body.targets,
            },
          },
          UnprocessableEntityException,
        ],
      ];
      test.each(cases)('%s', async (_, polymeshError, httpException) => {
        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.pay.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

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

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.pay.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

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
        expect(distributionWithDetails.distribution.pay).toHaveBeenCalledWith(
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

  describe('linkDocuments', () => {
    let mockDistributionWithDetails: MockDistributionWithDetails;
    const body = {
      documents: [
        new AssetDocumentDto({
          name: 'DOC_NAME',
          uri: 'DOC_URI',
          type: 'DOC_TYPE',
        }),
      ],
      signer: '0x6'.padEnd(66, '0'),
    };

    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
      mockDistributionWithDetails = new MockDistributionWithDetails();
    });

    afterAll(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if some of the provided documents are not associated with the Asset of the Corporate Action', () => {
      it('should throw an UnprocessableEntityException', async () => {
        const mockError = {
          code: ErrorCode.UnmetPrerequisite,
          message: 'Some of the provided documents are not associated with the Security Token',
        };
        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);
        mockDistributionWithDetails.distribution.linkDocuments.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.linkDocuments('TICKER', new BigNumber('1'), body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).message).toEqual(
          'Some of the provided documents are not associated with the Asset'
        );
      });
    });

    describe('otherwise', () => {
      it('should run the linkDocuments procedure and return the queue results', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.corporateAction.LinkCaDoc,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockDistributionWithDetails.distribution.linkDocuments.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.linkDocuments('TICKER', new BigNumber('1'), body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.corporateAction.LinkCaDoc,
            },
          ],
        });
      });
    });
  });

  describe('claimDividends', () => {
    const signer = '0x6'.padEnd(66, '0');

    describe('distribution.claim errors', () => {
      const cases: ErrorCase[] = [
        [
          "Distribution's payment date hasn't been reached",
          {
            code: ErrorCode.UnmetPrerequisite,
            message: "The Distribution's payment date hasn't been reached",
            data: { paymentDate: new Date() },
          },
          UnprocessableEntityException,
        ],
        [
          'Distribution is expired',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The Distribution has already expired',
            data: {
              expiryDate: new Date(),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Target Identity is not included in the Distribution',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The current Identity is not included in this Distribution',
          },
          UnprocessableEntityException,
        ],
        [
          'Target Identity has already claimed dividends',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The current Identity has already claimed dividends',
          },
          UnprocessableEntityException,
        ],
      ];

      test.each(cases)('%s', async (_, polymeshError, httpException) => {
        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const distubutionWithDetails = new MockDistributionWithDetails();
        distubutionWithDetails.distribution.claim.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distubutionWithDetails as any);

        let error;
        try {
          await service.claimDividends('TICKER', new BigNumber('1'), signer);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(httpException);

        mockIsPolymeshError.mockReset();
        findDistributionSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            tag: TxTags.capitalDistribution.Claim,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        const distubutionWithDetails = new MockDistributionWithDetails();
        distubutionWithDetails.distribution.claim.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distubutionWithDetails as any);

        const address = 'address';
        mockRelayerAccountsService.findAddressByDid.mockReturnValue(address);

        const result = await service.claimDividends('TICKER', new BigNumber(1), signer);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              transactionTag: TxTags.capitalDistribution.Claim,
            },
          ],
        });
        expect(distubutionWithDetails.distribution.claim).toHaveBeenCalledWith(undefined, {
          signer: address,
        });
        findDistributionSpy.mockRestore();
      });
    });
  });
});
