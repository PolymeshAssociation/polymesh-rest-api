/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CaCheckpointType,
  ErrorCode,
  TargetTreatment,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { TransactionType } from '~/common/types';
import { CorporateActionsService } from '~/corporate-actions/corporate-actions.service';
import { MockCorporateActionDefaultConfig } from '~/corporate-actions/mocks/corporate-action-default-config.mock';
import { MockDistributionWithDetails } from '~/corporate-actions/mocks/distribution-with-details.mock';
import { MockDistribution } from '~/corporate-actions/mocks/dividend-distribution.mock';
import { mockSigningProvider } from '~/signing/signing.mock';
import { MockAsset, MockTransactionQueue } from '~/test-utils/mocks';
import { MockAssetService } from '~/test-utils/service-mocks';
import { ErrorCase } from '~/test-utils/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('CorporateActionsService', () => {
  let service: CorporateActionsService;

  const mockAssetsService = new MockAssetService();

  const mockSigningService = mockSigningProvider.useValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateActionsService, AssetsService, mockSigningProvider],
    })
      .overrideProvider(AssetsService)
      .useValue(mockAssetsService)
      .compile();

    service = module.get<CorporateActionsService>(CorporateActionsService);

    mockIsPolymeshTransaction.mockReturnValue(true);
  });

  afterAll(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  describe('findDefaultConfigByTicker', () => {
    it('should return the Corporate Action Default Config for an Asset', async () => {
      const mockCorporateActionDefaultConfig = new MockCorporateActionDefaultConfig();

      const mockAsset = new MockAsset();
      mockAsset.corporateActions.getDefaultConfig.mockResolvedValue(
        mockCorporateActionDefaultConfig
      );

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

      const result = await service.findDefaultConfigByTicker('TICKER');

      expect(result).toEqual(mockCorporateActionDefaultConfig);
    });
  });

  describe('updateDefaultConfigByTicker', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
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
        mockAsset.corporateActions.setDefaultConfig.mockImplementation(() => {
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
            blockNumber: new BigNumber(1),
            tag: TxTags.corporateAction.SetDefaultWithholdingTax,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        mockAsset.corporateActions.setDefaultConfig.mockResolvedValue(mockQueue);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const body = {
          signer: '0x6'.padEnd(66, '0'),
          defaultTaxWithholding: new BigNumber(25),
        };
        const result = await service.updateDefaultConfigByTicker(ticker, body);

        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.corporateAction.SetDefaultWithholdingTax,
              type: TransactionType.Single,
            },
          ],
        });
        expect(mockAsset.corporateActions.setDefaultConfig).toHaveBeenCalledWith(
          { defaultTaxWithholding: new BigNumber(25) },
          { signingAccount: address }
        );
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
  });

  describe('findDistributionsByTicker', () => {
    it('should return the Dividend Distributions associated with an Asset', async () => {
      const mockDistributions = [new MockDistributionWithDetails()];

      const mockAsset = new MockAsset();
      mockAsset.corporateActions.distributions.get.mockResolvedValue(mockDistributions);

      mockAssetsService.findOne.mockResolvedValue(mockAsset);

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
        const mockAsset = new MockAsset();
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: 'The Dividend Distribution does not exist',
        };
        mockAsset.corporateActions.distributions.getOne.mockImplementation(() => {
          throw mockError;
        });
        mockAssetsService.findOne.mockResolvedValue(mockAsset);

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.findDistribution('TICKER', new BigNumber(1));
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
      });
    });
    describe('if there is a different error', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error('foo');

        const mockAsset = new MockAsset();
        mockAsset.corporateActions.distributions.getOne.mockImplementation(() => {
          throw expectedError;
        });

        mockAssetsService.findOne.mockResolvedValue(mockAsset);

        let error;
        try {
          await service.findDistribution('TICKER', new BigNumber(1));
        } catch (err) {
          error = err;
        }

        expect(error).toEqual(expectedError);
      });
    });
    describe('otherwise', () => {
      it('should return a specific Dividend Distribution associated with an Asset', async () => {
        const mockDistributions = new MockDistributionWithDetails();

        const mockAsset = new MockAsset();
        mockAsset.corporateActions.distributions.getOne.mockResolvedValue(mockDistributions);

        mockAssetsService.findOne.mockResolvedValue(mockAsset);

        const result = await service.findDistribution('TICKER', new BigNumber(1));

        expect(result).toEqual(mockDistributions);
      });
    });
  });

  describe('createDividendDistribution', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';
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

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    describe('distributions.configureDividendDistribution errors', () => {
      const cases: ErrorCase[] = [
        [
          "Origin Portfolio doesn't exist",
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
          'Distribution expires before the payment date',
          {
            code: ErrorCode.ValidationError,
            message: 'Expiry date must be after payment date',
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
      ];
      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        mockAsset.corporateActions.distributions.configureDividendDistribution.mockImplementation(
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
        expect(error).toBeInstanceOf(HttpException);
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
        mockIsPolymeshError.mockReset();
      });
    });
    describe('otherwise', () => {
      it('should run a configureDividendDistribution procedure and return the created Dividend Distribution', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.corporateAction.InitiateCorporateAction,
          },
          {
            blockHash: '0x3',
            txHash: '0x4',
            blockNumber: new BigNumber(2),
            tag: TxTags.capitalDistribution.Distribute,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        const mockDistribution = new MockDistribution();
        mockQueue.run.mockResolvedValue(mockDistribution);
        mockAsset.corporateActions.distributions.configureDividendDistribution.mockResolvedValue(
          mockQueue
        );

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.createDividendDistribution(ticker, body);

        expect(result).toEqual({
          result: mockDistribution,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.corporateAction.InitiateCorporateAction,
              type: TransactionType.Single,
            },
            {
              blockHash: '0x3',
              transactionHash: '0x4',
              blockNumber: new BigNumber(2),
              transactionTag: TxTags.capitalDistribution.Distribute,
              type: TransactionType.Single,
            },
          ],
        });
        expect(mockAssetsService.findOne).toHaveBeenCalledWith(ticker);
      });
    });
  });

  describe('remove', () => {
    let mockAsset: MockAsset;
    const ticker = 'TICKER';

    beforeEach(() => {
      mockAsset = new MockAsset();
      mockAssetsService.findOne.mockResolvedValue(mockAsset);
    });

    describe('if there is an error while deleting a Corporate Action', () => {
      it('should pass the error along the chain', async () => {
        const expectedError = new Error("The Corporate Action doesn't exist");

        mockAsset.corporateActions.remove.mockImplementation(() => {
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
        mockIsPolymeshError.mockReset();
      });
    });
    describe('otherwise', () => {
      it('should run a remove procedure and return the delete the Corporate Action', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.corporateAction.RemoveCa,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockAsset.corporateActions.remove.mockResolvedValue(mockQueue);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.remove(ticker, new BigNumber(1), '0x6'.padEnd(66, '0'));

        expect(result).toEqual({
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.corporateAction.RemoveCa,
              type: TransactionType.Single,
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
      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

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
          await service.payDividends('TICKER', new BigNumber(1), body);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(HttpException);

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
            blockNumber: new BigNumber(1),
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
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.payDividends('TICKER', new BigNumber(1), body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.capitalDistribution.PushBenefit,
              type: TransactionType.Single,
            },
          ],
        });
        expect(distributionWithDetails.distribution.pay).toHaveBeenCalledWith(
          {
            targets: body.targets,
          },
          {
            signingAccount: address,
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
          message: 'Some of the provided documents are not associated with the Asset',
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
          await service.linkDocuments('TICKER', new BigNumber(1), body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(UnprocessableEntityException);
        expect((error as UnprocessableEntityException).message).toEqual(
          'Some of the provided documents are not associated with the Asset'
        );
        findDistributionSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should run the linkDocuments procedure and return the queue results', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.corporateAction.LinkCaDoc,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockDistributionWithDetails.distribution.linkDocuments.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.linkDocuments('TICKER', new BigNumber(1), body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.corporateAction.LinkCaDoc,
              type: TransactionType.Single,
            },
          ],
        });
        findDistributionSpy.mockRestore();
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

      test.each(cases)('%s', async (_, polymeshError, HttpException) => {
        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.claim.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

        let error;
        try {
          await service.claimDividends('TICKER', new BigNumber(1), signer);
        } catch (err) {
          error = err;
        }
        expect(error).toBeInstanceOf(HttpException);

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
            blockNumber: new BigNumber(1),
            tag: TxTags.capitalDistribution.Claim,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.claim.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.claimDividends('TICKER', new BigNumber(1), signer);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.capitalDistribution.Claim,
              type: TransactionType.Single,
            },
          ],
        });
        expect(distributionWithDetails.distribution.claim).toHaveBeenCalledWith(undefined, {
          signingAccount: address,
        });
        findDistributionSpy.mockRestore();
      });
    });
  });

  describe('reclaimRemainingFunds', () => {
    const signer = '0x6'.padEnd(66, '0');

    describe('distribution.reclaimFunds errors', () => {
      const cases: ErrorCase[] = [
        [
          'Distribution is expired',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'The Distribution must be expired',
            data: {
              expiryDate: new Date(),
            },
          },
          UnprocessableEntityException,
        ],
        [
          'Distribution funds already reclaimed',
          {
            code: ErrorCode.UnmetPrerequisite,
            message: 'Distribution funds have already been reclaimed',
          },
          UnprocessableEntityException,
        ],
      ];
      test.each(cases)('%s', async (_, polymeshError, httpException) => {
        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.reclaimFunds.mockImplementation(() => {
          throw polymeshError;
        });
        mockIsPolymeshError.mockReturnValue(true);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

        let error;
        try {
          await service.reclaimRemainingFunds('TICKER', new BigNumber(1), signer);
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
            blockNumber: new BigNumber(1),
            tag: TxTags.capitalDistribution.Reclaim,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);

        const distributionWithDetails = new MockDistributionWithDetails();
        distributionWithDetails.distribution.reclaimFunds.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(distributionWithDetails as any);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.reclaimRemainingFunds('TICKER', new BigNumber(1), signer);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.capitalDistribution.Reclaim,
              type: TransactionType.Single,
            },
          ],
        });
        expect(distributionWithDetails.distribution.reclaimFunds).toHaveBeenCalledWith(undefined, {
          signingAccount: address,
        });
        findDistributionSpy.mockRestore();
      });
    });
  });

  describe('modifyCheckpoint', () => {
    let mockDistributionWithDetails: MockDistributionWithDetails;
    const body = {
      checkpoint: {
        id: new BigNumber(1),
        type: CaCheckpointType.Existing,
      },
      signer: '0x6'.padEnd(66, '0'),
    };

    beforeEach(() => {
      mockIsPolymeshError.mockReturnValue(false);
      mockDistributionWithDetails = new MockDistributionWithDetails();
    });

    afterEach(() => {
      mockIsPolymeshError.mockReset();
    });

    describe('if provided Checkpoint does not exist', () => {
      it('should throw an NotFoundException', async () => {
        const mockError = {
          code: ErrorCode.DataUnavailable,
          message: "Checkpoint doesn't exist",
        };
        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);
        mockDistributionWithDetails.distribution.modifyCheckpoint.mockImplementation(() => {
          throw mockError;
        });

        mockIsPolymeshError.mockReturnValue(true);

        let error;
        try {
          await service.modifyCheckpoint('TICKER', new BigNumber(1), body);
        } catch (err) {
          error = err;
        }

        expect(error).toBeInstanceOf(NotFoundException);
        findDistributionSpy.mockRestore();
      });
    });

    describe('otherwise', () => {
      it('should run the modifyCheckpoint procedure and return the queue results', async () => {
        const transactions = [
          {
            blockHash: '0x1',
            txHash: '0x2',
            blockNumber: new BigNumber(1),
            tag: TxTags.corporateAction.ChangeRecordDate,
          },
        ];
        const mockQueue = new MockTransactionQueue(transactions);
        mockDistributionWithDetails.distribution.modifyCheckpoint.mockResolvedValue(mockQueue);

        const findDistributionSpy = jest.spyOn(service, 'findDistribution');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findDistributionSpy.mockResolvedValue(mockDistributionWithDetails as any);

        const address = 'address';
        mockSigningService.getAddressByHandle.mockReturnValue(address);

        const result = await service.modifyCheckpoint('TICKER', new BigNumber(1), body);
        expect(result).toEqual({
          result: undefined,
          transactions: [
            {
              blockHash: '0x1',
              transactionHash: '0x2',
              blockNumber: new BigNumber(1),
              transactionTag: TxTags.corporateAction.ChangeRecordDate,
              type: TransactionType.Single,
            },
          ],
        });
        findDistributionSpy.mockRestore();
      });
    });
  });
});
