/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { InstructionStatus } from '@polymathnetwork/polymesh-sdk/types';

import { IdentitiesService } from '~/identities/identities.service';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('SettlementsController', () => {
  let controller: SettlementsController;
  const mockSettlementsService = {
    findInstruction: jest.fn(),
    createInstruction: jest.fn(),
    affirmInstruction: jest.fn(),
  };
  const mockIdentitiesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementsController],
      providers: [SettlementsService, IdentitiesService],
    })
      .overrideProvider(SettlementsService)
      .useValue(mockSettlementsService)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    controller = module.get<SettlementsController>(SettlementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInstruction', () => {
    it('should return the instruction status', async () => {
      const date = new Date();
      const mockStatus = {
        status: InstructionStatus.Executed,
        eventIdentifier: {
          blockNumber: new BigNumber('123'),
          blockDate: date,
          eventIndex: 3,
        },
      };
      mockSettlementsService.findInstruction.mockResolvedValue(mockStatus);

      const result = await controller.getInstruction({ id: '3' });

      expect(result).toEqual(mockStatus);
    });
  });

  describe('createInstruction', () => {
    it('should create an instruction and return the data returned by the service', async () => {
      const transactions = ['transaction'];
      const mockData = {
        result: { id: 'id' },
        transactions,
      };
      mockSettlementsService.createInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.createInstruction({ id: '3' }, {} as any);

      expect(result).toEqual({
        instructionId: 'id',
        transactions,
      });
    });
  });

  describe('affirmInstruction', () => {
    it('should affirm an instruction and return the data returned by the service', async () => {
      const transactions = ['transaction'];
      const mockData = {
        transactions,
      };
      mockSettlementsService.affirmInstruction.mockResolvedValue(mockData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.affirmInstruction({ id: '3' }, {} as any);

      expect(result).toEqual({
        transactions,
      });
    });
  });
});
