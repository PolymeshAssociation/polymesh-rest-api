import { Test, TestingModule } from '@nestjs/testing';
import { ClaimType, ConditionType, ScopeType } from '@polymathnetwork/polymesh-sdk/types';

import { ResultsModel } from '~/common/models/results.model';
import { ComplianceController } from '~/compliance/compliance.controller';
import { ComplianceService } from '~/compliance/compliance.service';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { MockComplianceService } from '~/test-utils/mocks';

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
      const mockRequirements = [
        {
          id: 1,
          conditions: [
            {
              type: ConditionType.IsPresent,
              claim: {
                type: ClaimType.Accredited,
                scope: {
                  type: ScopeType.Identity,
                  value: 'Ox6'.padEnd(66, '0'),
                },
              },
              target: 'Receiver',
              trustedClaimIssuers: [],
            },
          ],
        },
      ];
      mockService.findComplianceRequirements.mockResolvedValue(mockRequirements);

      const result = await controller.getComplianceRequirements({ ticker: 'SOME_TICKER' });

      expect(result).toEqual(new ResultsModel({ results: mockRequirements }));
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
