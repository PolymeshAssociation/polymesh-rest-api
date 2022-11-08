import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { TransactionType } from '~/common/types';
import { RemoveTrustedClaimIssuersDto } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuersDto } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TrustedClaimIssuersController } from '~/compliance/trusted-claim-issuers.controller';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { mockTrustedClaimIssuer } from '~/test-utils/mocks';
import { mockTrustedClaimIssuersServiceProvider } from '~/test-utils/service-mocks';

class CorrectPolymeshTransaction {
  blockNumber: BigNumber;
  type: TransactionType.Batch;
  blockHash: string;
  transactionHash: string;

  constructor(transaction: {
    blockNumber: BigNumber;
    type: string;
    blockHash: string;
    transactionHash: string;
  }) {
    Object.assign(this, transaction);
  }
}

describe('TrustedClaimIssuersController', () => {
  const mockParams = { ticker: 'TICKER' };
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
      when(mockService.find)
        .calledWith(mockParams.ticker)
        .mockResolvedValue([mockTrustedClaimIssuer]);

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
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: 'single',
        transactionTag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const mockTransaction = new CorrectPolymeshTransaction(transaction);

      const mockPayload: SetTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      const response = {
        transactions: [transaction],
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(mockService.set)
        .calledWith(mockParams.ticker, mockPayload)
        .mockResolvedValue({ transactions: [mockTransaction] });

      const result = await controller.setTrustedClaimIssuers({ ticker: 'TICKER' }, mockPayload);

      expect(result).toEqual(response);
    });
  });

  describe.skip('addTrustedClaimIssuers', () => {
    it('should accept SetTrustedClaimIssuersDto and add Asset trusted claim issuers', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: 'single',
        transactionTag: TxTags.complianceManager.AddDefaultTrustedClaimIssuer,
      };

      const mockTransaction = new CorrectPolymeshTransaction(transaction);

      const mockPayload: SetTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      const response = {
        transactions: [transaction],
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(mockService.add)
        .calledWith(mockParams.ticker, mockPayload)
        .mockResolvedValue({ transactions: [mockTransaction] });

      const result = await controller.addTrustedClaimIssuers({ ticker: 'TICKER' }, mockPayload);

      expect(result).toEqual(response);
    });
  });

  describe.skip('removeTrustedClaimIssuers', () => {
    it('should accept RemoveTrustedClaimIssuersDto and remove trusted claim issuers for Asset', async () => {
      const transaction = {
        blockHash: '0x1',
        transactionHash: '0x2',
        blockNumber: new BigNumber(1),
        type: 'single',
        transactionTag: TxTags.complianceManager.RemoveDefaultTrustedClaimIssuer,
      };

      const mockTransaction = new CorrectPolymeshTransaction(transaction);

      const mockPayload: RemoveTrustedClaimIssuersDto = {
        claimIssuers: [],
        signer: 'Alice',
      };

      const response = {
        transactions: [transaction],
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(mockService.remove)
        .calledWith(mockParams.ticker, mockPayload)
        .mockResolvedValue({ transactions: [mockTransaction] });

      const result = await controller.removeTrustedClaimIssuers({ ticker: 'TICKER' }, mockPayload);

      expect(result).toEqual(response);
    });
  });
});
