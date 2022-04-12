import { Test, TestingModule } from '@nestjs/testing';

import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { MockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { MockComplianceService } from '~/test-utils/service-mocks';

describe('ComplianceController', () => {
  let controller: ComplianceController;

  const mockService = new MockComplianceService();

  const ticker = 'TICKER';
  const validBody = {
    signer: '0x0600000000000000000000000000000000000000000000000000000000000000',
    requirements: [
      [
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

  describe('getComplianceRequirements', () => {
    it('should return the list of all compliance requirements of an Asset', async () => {
      const mockComplianceRequirements = new MockComplianceRequirements();
      mockService.findComplianceRequirements.mockResolvedValue(mockComplianceRequirements);

      const result = await controller.getComplianceRequirements({ ticker: 'TICKER' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(mockComplianceRequirements as ComplianceRequirementsModel);
    });
  });

  describe('setRequirements', () => {
    it('should accept SetRulesDto and set new Asset Compliance Rules', async () => {
      const response = {
        transactions: [],
      };
      mockService.setRequirements.mockResolvedValue(response);
      const result = await controller.setRequirements({ ticker }, validBody as SetRequirementsDto);
      expect(result).toEqual(response);
    });
  });
});
