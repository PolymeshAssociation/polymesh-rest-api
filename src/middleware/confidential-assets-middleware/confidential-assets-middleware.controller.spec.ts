import { DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { ConfidentialAssetsMiddlewareController } from '~/middleware/confidential-assets-middleware/confidential-assets-middleware.controller';
import { mockConfidentialAssetsServiceProvider } from '~/test-utils/service-mocks';

describe('ConfidentialAssetsMiddlewareController', () => {
  let controller: ConfidentialAssetsMiddlewareController;
  let mockConfidentialAssetsService: DeepMocked<ConfidentialAssetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialAssetsMiddlewareController],
      providers: [mockConfidentialAssetsServiceProvider],
    }).compile();

    mockConfidentialAssetsService =
      module.get<typeof mockConfidentialAssetsService>(ConfidentialAssetsService);
    controller = module.get<ConfidentialAssetsMiddlewareController>(
      ConfidentialAssetsMiddlewareController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createdAt', () => {
    it('should throw AppNotFoundError if the event details are not yet ready', () => {
      mockConfidentialAssetsService.createdAt.mockResolvedValue(null);

      return expect(() =>
        controller.createdAt({ confidentialAssetId: 'SOME_ASSET_ID' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    describe('otherwise', () => {
      it('should return the Portfolio creation event details', async () => {
        const eventIdentifier = {
          blockNumber: new BigNumber('2719172'),
          blockHash: 'someHash',
          blockDate: new Date('2021-06-26T01:47:45.000Z'),
          eventIndex: new BigNumber(1),
        };
        mockConfidentialAssetsService.createdAt.mockResolvedValue(eventIdentifier);

        const result = await controller.createdAt({ confidentialAssetId: 'SOME_ASSET_ID' });

        expect(result).toEqual(new EventIdentifierModel(eventIdentifier));
      });
    });
  });
});
