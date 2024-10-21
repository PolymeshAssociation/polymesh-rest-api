import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { when } from 'jest-when';

import { ComplianceRequirementsController } from '~/compliance/compliance-requirements.controller';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { RequirementDto } from '~/compliance/dto/requirement.dto';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { mockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { ComplianceStatusModel } from '~/compliance/models/compliance-status.model';
import { testValues } from '~/test-utils/consts';
import { createMockTransactionResult } from '~/test-utils/mocks';
import { mockComplianceRequirementsServiceProvider } from '~/test-utils/service-mocks';

describe('ComplianceRequirementsController', () => {
  let controller: ComplianceRequirementsController;
  let mockService: ComplianceRequirementsService;
  const { did, signer, txResult, assetId } = testValues;

  const validBody = {
    signer,
    requirements: [
      [
        {
          target: 'Sender',
          type: 'IsPresent',
          claim: {
            type: 'Accredited',
            scope: {
              type: 'Identity',
              value: did,
            },
          },
        },
      ],
    ],
  };
  const txResponse = createMockTransactionResult<void>({ ...txResult, transactions: [] });
  const id = new BigNumber(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceRequirementsController],
      providers: [mockComplianceRequirementsServiceProvider],
    }).compile();

    mockService =
      mockComplianceRequirementsServiceProvider.useValue as DeepMocked<ComplianceRequirementsService>;
    controller = module.get(ComplianceRequirementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getComplianceRequirements', () => {
    it('should return the list of all compliance requirements of an Asset', async () => {
      when(mockService.findComplianceRequirements)
        .calledWith(assetId)
        .mockResolvedValue(mockComplianceRequirements);

      const result = await controller.getComplianceRequirements({ asset: assetId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(new ComplianceRequirementsModel(mockComplianceRequirements as any));
    });
  });

  describe('setRequirements', () => {
    it('should accept SetRulesDto and set new Asset Compliance Rules', async () => {
      const response = createMockTransactionResult<void>({ ...txResult, transactions: [] });

      when(mockService.setRequirements)
        .calledWith(assetId, validBody as SetRequirementsDto)
        .mockResolvedValue(response);

      const result = await controller.setRequirements(
        { asset: assetId },
        validBody as SetRequirementsDto
      );
      expect(result).toEqual(response);
    });
  });

  describe('pauseRequirements', () => {
    it('should accept TransactionBaseDto and pause Asset Compliance Rules', async () => {
      when(mockService.pauseRequirements)
        .calledWith(assetId, validBody)
        .mockResolvedValue(txResponse);

      const result = await controller.pauseRequirements({ asset: assetId }, validBody);
      expect(result).toEqual(txResponse);
    });
  });

  describe('unpauseRequirements', () => {
    it('should accept TransactionBaseDto and unpause Asset Compliance Rules', async () => {
      when(mockService.unpauseRequirements)
        .calledWith(assetId, validBody)
        .mockResolvedValue(txResponse);

      const result = await controller.unpauseRequirements({ asset: assetId }, validBody);
      expect(result).toEqual(txResponse);
    });
  });

  describe('deleteRequirement', () => {
    it('should accept TransactionBaseDto and compliance requirement ID and delete the corresponding Asset Compliance rule for the given Asset', async () => {
      when(mockService.deleteOne).calledWith(assetId, id, validBody).mockResolvedValue(txResponse);

      const result = await controller.deleteRequirement({ asset: assetId, id }, validBody);

      expect(result).toEqual(txResponse);
    });
  });

  describe('deleteRequirements', () => {
    it('should accept TransactionBaseDto and delete all the Asset Compliance rules for the given Asset', async () => {
      when(mockService.deleteAll).calledWith(assetId, validBody).mockResolvedValue(txResponse);

      const result = await controller.deleteRequirements({ asset: assetId }, validBody);

      expect(result).toEqual(txResponse);
    });
  });

  describe('addRequirement', () => {
    it('should accept RequirementDto and add an Asset Compliance rule', async () => {
      const { requirements } = validBody;

      when(mockService.add)
        .calledWith(assetId, {
          signer,
          conditions: requirements[0],
        } as RequirementDto)
        .mockResolvedValue(txResponse);

      const result = await controller.addRequirement({ asset: assetId }, {
        signer,
        conditions: requirements[0],
      } as RequirementDto);
      expect(result).toEqual(txResponse);
    });
  });

  describe('modifyComplianceRequirement', () => {
    it('should accept RequirementDto and modify the corresponding Asset Compliance rule', async () => {
      const response = createMockTransactionResult<void>({ ...txResult, transactions: [] });
      const { requirements } = validBody;

      when(mockService.modify)
        .calledWith(assetId, id, {
          signer,
          conditions: requirements[0],
        } as RequirementDto)
        .mockResolvedValue(response);

      const result = await controller.modifyComplianceRequirement({ asset: assetId, id }, {
        signer,
        conditions: requirements[0],
      } as RequirementDto);

      expect(result).toEqual(response);
    });
  });

  describe('areRequirementsPaused', () => {
    it('should return the result of arePaused method', async () => {
      const response = false;

      when(mockService.arePaused).calledWith(assetId).mockResolvedValue(response);

      const result = await controller.areRequirementsPaused({ asset: assetId });

      expect(result).toEqual(new ComplianceStatusModel({ arePaused: response }));
    });
  });
});
