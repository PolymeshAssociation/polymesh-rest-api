import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CheckpointsController } from '~/checkpoints/checkpoints.controller';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoint-details.model';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { PeriodComplexityModel } from '~/checkpoints/models/period-complexity.model';
import { ScheduleComplexityModel } from '~/checkpoints/models/schedule-complexity.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockCheckpoint, MockCheckpointSchedule } from '~/test-utils/mocks';
import { MockCheckpointsService } from '~/test-utils/service-mocks';

const { did, signer, txResult, assetId } = testValues;

describe('CheckpointsController', () => {
  let controller: CheckpointsController;

  const mockCheckpointsService = new MockCheckpointsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckpointsController],
      providers: [CheckpointsService],
    })
      .overrideProvider(CheckpointsService)
      .useValue(mockCheckpointsService)
      .compile();

    controller = module.get<CheckpointsController>(CheckpointsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCheckpoint', () => {
    it('should return the Checkpoint data', async () => {
      const createdAt = new Date();
      const totalSupply = new BigNumber(1000);
      const id = new BigNumber(1);

      const mockCheckpoint = new MockCheckpoint();
      mockCheckpoint.createdAt.mockResolvedValue(createdAt);
      mockCheckpoint.totalSupply.mockResolvedValue(totalSupply);
      mockCheckpointsService.findOne.mockResolvedValue(mockCheckpoint);

      const result = await controller.getCheckpoint({ asset: assetId, id });
      expect(result).toEqual(new CheckpointDetailsModel({ id, totalSupply, createdAt }));
    });
  });

  describe('getCheckpoints', () => {
    const mockDate = new Date();
    const mockCheckpoints = {
      data: [
        {
          checkpoint: {
            id: new BigNumber(1),
          },
          createdAt: mockDate,
          totalSupply: new BigNumber(10000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    const mockResult = new PaginatedResultsModel({
      results: [
        {
          id: new BigNumber(1),
          createdAt: mockDate,
          totalSupply: new BigNumber(10000),
        },
      ],
      total: new BigNumber(2),
      next: '0xddddd',
    });
    it('should return the list of Checkpoints created on an Asset', async () => {
      mockCheckpointsService.findAllByAsset.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints(
        { asset: assetId },
        { size: new BigNumber(1) }
      );

      expect(result).toEqual(mockResult);
    });

    it('should return the list of Checkpoints created on an Asset from start key', async () => {
      mockCheckpointsService.findAllByAsset.mockResolvedValue(mockCheckpoints);

      const result = await controller.getCheckpoints(
        { asset: assetId },
        { size: new BigNumber(1), start: 'START_KEY' }
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe('createCheckpoint', () => {
    it('should return the details of newly created Checkpoint', async () => {
      const mockCheckpoint = new MockCheckpoint();
      const response = {
        ...txResult,
        result: mockCheckpoint,
      };
      mockCheckpointsService.createByAsset.mockResolvedValue(response);
      const body = {
        signer: 'signer',
      };

      const result = await controller.createCheckpoint({ asset: assetId }, body);

      expect(result).toEqual({
        ...processedTxResult,
        checkpoint: mockCheckpoint,
      });
    });
  });

  describe('getSchedules', () => {
    it('should return the list of active Checkpoint Schedules for an Asset', async () => {
      const mockDate = new Date();
      const mockSchedules = [
        {
          schedule: {
            id: new BigNumber(1),
            pendingPoints: [mockDate],
            start: mockDate,
            expiryDate: null,
          },
          details: {
            remainingCheckpoints: new BigNumber(1),
            nextCheckpointDate: mockDate,
          },
        },
      ];

      mockCheckpointsService.findSchedulesByAsset.mockResolvedValue(mockSchedules);

      const result = await controller.getSchedules({ asset: assetId });

      const mockResult = [
        new CheckpointScheduleModel({
          id: new BigNumber(1),
          asset: assetId,
          pendingPoints: [mockDate],
          expiryDate: null,
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        }),
      ];

      expect(result).toEqual(new ResultsModel({ results: mockResult }));
    });
  });

  describe('getSchedule', () => {
    it('should call the service and return the Checkpoint Schedule details', async () => {
      const mockDate = new Date('10/14/1987');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { getCheckpoints, ...schedule } = new MockCheckpointSchedule();
      const mockScheduleWithDetails = {
        schedule,
        details: {
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        },
      };
      mockCheckpointsService.findScheduleById.mockResolvedValue(mockScheduleWithDetails);

      const result = await controller.getSchedule({ asset: assetId, id: new BigNumber(1) });

      const mockResult = new CheckpointScheduleModel({
        id: mockScheduleWithDetails.schedule.id,
        expiryDate: mockScheduleWithDetails.schedule.expiryDate,
        asset: mockScheduleWithDetails.schedule.assetId,
        ...mockScheduleWithDetails.details,
        pendingPoints: [mockDate],
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('createSchedule', () => {
    it('should return the details of newly created Checkpoint Schedule', async () => {
      const mockDate = new Date('10/14/1987');

      const mockCheckpointSchedule = new MockCheckpointSchedule();
      const response = {
        ...txResult,
        result: mockCheckpointSchedule,
      };
      mockCheckpointsService.createScheduleByAsset.mockResolvedValue(response);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { getCheckpoints, ...schedule } = new MockCheckpointSchedule();
      const mockScheduleWithDetails = {
        schedule,
        details: {
          remainingCheckpoints: new BigNumber(1),
          nextCheckpointDate: mockDate,
        },
      };
      mockCheckpointsService.findScheduleById.mockResolvedValue(mockScheduleWithDetails);

      const body = {
        signer: 'signer',
        points: [mockDate],
      };

      const result = await controller.createSchedule({ asset: assetId }, body);

      const mockCreatedSchedule = new CheckpointScheduleModel({
        id: mockScheduleWithDetails.schedule.id,
        expiryDate: mockScheduleWithDetails.schedule.expiryDate,
        asset: mockScheduleWithDetails.schedule.assetId,
        ...mockScheduleWithDetails.details,
        pendingPoints: [mockDate],
      });
      expect(result).toEqual({
        ...processedTxResult,
        schedule: mockCreatedSchedule,
      });
    });
  });

  describe('getHolders', () => {
    const mockAssetHolders = {
      data: [
        {
          identity: { did: '0xe2dd3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2' },
          balance: new BigNumber(627880),
        },
        {
          identity: { did: '0x666d3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2' },
          balance: new BigNumber(1000),
        },
      ],
      next: '0xddddd',
      count: new BigNumber(2),
    };

    const mockResult = new PaginatedResultsModel({
      results: [
        new IdentityBalanceModel({
          identity: '0xe2dd3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2',
          balance: new BigNumber(627880),
        }),
        new IdentityBalanceModel({
          identity: '0x666d3f2cec45168793b700056404c88e17e2a4cd87060aa39a22f856be5c4fe2',
          balance: new BigNumber(1000),
        }),
      ],
      total: new BigNumber(2),
      next: '0xddddd',
    });
    it('should return the holders of an Asset at a given Checkpoint', async () => {
      mockCheckpointsService.getHolders.mockResolvedValue(mockAssetHolders);

      const result = await controller.getHolders(
        {
          asset: assetId,
          id: new BigNumber(1),
        },
        { size: new BigNumber(10) }
      );
      expect(result).toEqual(mockResult);
      expect(mockCheckpointsService.getHolders).toBeCalled();
    });
  });

  describe('getAssetBalance', () => {
    it('should return the balance of an Asset for an Identity at a given Checkpoint', async () => {
      const balance = new BigNumber(10);
      const id = new BigNumber(1);

      const balanceModel = new IdentityBalanceModel({ balance, identity: did });

      mockCheckpointsService.getAssetBalance.mockResolvedValue(balanceModel);

      const result = await controller.getAssetBalance({
        asset: assetId,
        did,
        id,
      });

      expect(result).toEqual(balanceModel);
      expect(mockCheckpointsService.getAssetBalance).toHaveBeenCalledWith(assetId, did, id);
    });
  });

  describe('deleteSchedule', () => {
    it('should return the transaction details', async () => {
      mockCheckpointsService.deleteScheduleByAsset.mockResolvedValue(txResult);

      const result = await controller.deleteSchedule(
        { id: new BigNumber(1), asset: assetId },
        { signer }
      );

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('getCheckpointsBySchedule', () => {
    it('should return the Checkpoint data', async () => {
      const createdAt = new Date();
      const totalSupply = new BigNumber(1000);
      const id = new BigNumber(1);

      const mockCheckpoint = new MockCheckpoint();
      mockCheckpointsService.findCheckpointsByScheduleId.mockResolvedValue([
        { checkpoint: mockCheckpoint, createdAt, totalSupply },
      ]);

      const result = await controller.getCheckpointsBySchedule({ asset: assetId, id });
      expect(result).toEqual([new CheckpointDetailsModel({ id, totalSupply, createdAt })]);
    });
  });

  describe('getComplexity', () => {
    it('should return the transaction details', async () => {
      const maxComplexity = new BigNumber(10);
      const id = new BigNumber(1);
      const pendingPoints = [new Date()];

      const mockSchedules = [
        {
          schedule: {
            id: new BigNumber(1),
            pendingPoints,
          },
        },
      ];

      mockCheckpointsService.getComplexityForAsset.mockResolvedValue({
        schedules: mockSchedules,
        maxComplexity,
      });

      const result = await controller.getComplexity({ asset: assetId });

      expect(result).toEqual([
        new ScheduleComplexityModel({
          id,
          maxComplexity,
          currentComplexity: new BigNumber(pendingPoints.length),
        }),
      ]);
    });
  });

  describe('getPeriodComplexity', () => {
    it('should call the service and return the Checkpoint Schedule complexity for given period', async () => {
      const complexity = new BigNumber(10000);
      mockCheckpointsService.getComplexityForPeriod.mockResolvedValue(complexity);
      const start = new Date();
      const end = new Date();
      const result = await controller.getPeriodComplexity(
        { asset: assetId, id: new BigNumber(1) },
        { start, end }
      );

      const mockResult = new PeriodComplexityModel({
        complexity,
      });
      expect(result).toEqual(mockResult);
      expect(mockCheckpointsService.getComplexityForPeriod).toBeCalledWith(
        assetId,
        new BigNumber(1),
        start,
        end
      );
    });
  });
});
