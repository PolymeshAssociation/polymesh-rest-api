import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ConfidentialVenue } from '@polymeshassociation/polymesh-sdk/types';

import { ServiceReturn } from '~/common/utils';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { ConfidentialVenuesController } from '~/confidential-transactions/confidential-venues.controller';
import { testValues } from '~/test-utils/consts';
import { createMockIdentity } from '~/test-utils/mocks';
import { mockConfidentialTransactionsServiceProvider } from '~/test-utils/service-mocks';

const { signer, txResult } = testValues;

describe('ConfidentialVenuesController', () => {
  let controller: ConfidentialVenuesController;
  let mockConfidentialTransactionsService: DeepMocked<ConfidentialTransactionsService>;
  const id = new BigNumber(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialVenuesController],
      providers: [mockConfidentialTransactionsServiceProvider],
    }).compile();

    mockConfidentialTransactionsService = module.get<typeof mockConfidentialTransactionsService>(
      ConfidentialTransactionsService
    );
    controller = module.get<ConfidentialVenuesController>(ConfidentialVenuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCreator', () => {
    it('should get the creator of a Confidential Venue', async () => {
      mockConfidentialTransactionsService.getVenueCreator.mockResolvedValue(
        createMockIdentity({ did: 'CREATOR_DID' })
      );

      const result = await controller.getCreator({ id });

      expect(result).toEqual(expect.objectContaining({ did: 'CREATOR_DID' }));
    });
  });

  describe('createVenue', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
      };
      mockConfidentialTransactionsService.createConfidentialVenue.mockResolvedValue(
        txResult as unknown as ServiceReturn<ConfidentialVenue>
      );

      const result = await controller.createVenue(input);
      expect(result).toEqual(txResult);
    });
  });
});
