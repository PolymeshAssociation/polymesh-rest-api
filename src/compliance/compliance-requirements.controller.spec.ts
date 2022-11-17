import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ComplianceRequirementsController } from '~/compliance/compliance-requirements.controller';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { RequirementDto } from '~/compliance/dto/requirement.dto';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { MockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { testValues } from '~/test-utils/consts';
import { MockComplianceRequirementsService } from '~/test-utils/service-mocks';

describe('ComplianceRequirementsController', () => {
  let controller: ComplianceRequirementsController;

  const mockService = new MockComplianceRequirementsService();
  const { txResult } = testValues;

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
      controllers: [ComplianceRequirementsController],
      providers: [ComplianceRequirementsService],
    })
      .overrideProvider(ComplianceRequirementsService)
      .useValue(mockService)
      .compile();

    controller = module.get(ComplianceRequirementsController);
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
      mockService.setRequirements.mockResolvedValue(txResult);
      const result = await controller.setRequirements({ ticker }, validBody as SetRequirementsDto);
      expect(result).toEqual(txResult);
    });
  });

  describe('pauseRequirements', () => {
    it('should accept TransactionBaseDto and pause Asset Compliance Rules', async () => {
      mockService.pauseRequirements.mockResolvedValue(txResult);
      const result = await controller.pauseRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );
      expect(result).toEqual(txResult);
    });
  });

  describe('unpauseRequirements', () => {
    it('should accept TransactionBaseDto and unpause Asset Compliance Rules', async () => {
      mockService.unpauseRequirements.mockResolvedValue(txResult);
      const result = await controller.pauseRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );
      expect(result).toEqual(txResult);
    });
  });

  describe('deleteRequirement', () => {
    it('should accept TransactionBaseDto and compliance requirement ID and delete the corresponding Asset Compliance rule for the given ticker', async () => {
      mockService.deleteOne.mockResolvedValue(txResult);
      const result = await controller.deleteRequirement(
        { ticker, id: new BigNumber(1) },
        validBody as TransactionBaseDto
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('deleteRequirements', () => {
    it('should accept TransactionBaseDto and delete all the Asset Compliance rules for the given ticker', async () => {
      mockService.deleteAll.mockResolvedValue(txResult);
      const result = await controller.deleteRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );

      expect(result).toEqual(txResult);
    });
  });

  describe('addRequirement', () => {
    it('should accept RequirementDto and add an Asset Compliance rule', async () => {
      mockService.add.mockResolvedValue(txResult);
      const { signer, requirements } = validBody;
      const result = await controller.addRequirement({ ticker }, {
        signer,
        conditions: requirements[0],
      } as RequirementDto);
      expect(result).toEqual(txResult);
    });
  });

  describe('modifyComplianceRequirement', () => {
    it('should accept RequirementDto and modify the corresponding Asset Compliance rule', async () => {
      mockService.modify.mockResolvedValue(txResult);
      const { signer, requirements } = validBody;
      const result = await controller.modifyComplianceRequirement(
        { ticker, id: new BigNumber(1) },
        {
          signer,
          conditions: requirements[0],
        } as RequirementDto
      );
      expect(result).toEqual(txResult);
    });
  });
});
