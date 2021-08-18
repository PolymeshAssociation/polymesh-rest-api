/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';

import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRulesDto } from '~/compliance/dto/set-rules.dto';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('SettlementsController', () => {
  let controller: ComplianceController;
  const mockService = {
    setRules: jest.fn(),
  };
  const ticker = 'TICKER';
  const validBody = {
    signer: '0x0600000000000000000000000000000000000000000000000000000000000000',
    requirements: [
      {
        conditionSet: [
          {
            target: 'Sender',
            type: 'IsPresent',
            claim: {
              type: 'Accredited',
              scope: {
                type: 'Identity',
                value: '0x0600000000000000000000000000000000000000000000000000000000000000',
              },
            },
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [ComplianceService],
    })
      .overrideProvider(ComplianceService)
      .useValue(mockService)
      .compile();

    controller = module.get(ComplianceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('otherwise', () => {
    it('should accept SetRulesDto and set new Asset Compliance Rules', async () => {
      const response = {
        transactions: [],
      };
      mockService.setRules.mockResolvedValue(response);
      const result = await controller.setRules({ ticker }, validBody as SetRulesDto);
      expect(result).toEqual(response);
    });
  });
});
