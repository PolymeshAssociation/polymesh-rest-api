import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Asset } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ComplianceRequirementsController } from '~/compliance/compliance-requirements.controller';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { RequirementDto } from '~/compliance/dto/requirement.dto';
import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { mockComplianceRequirements } from '~/compliance/mocks/compliance-requirements.mock';
import { ComplianceRequirementsModel } from '~/compliance/models/compliance-requirements.model';
import { createMockTransactionResult } from '~/test-utils/mocks';
import { mockComplianceRequirementsServiceProvider } from '~/test-utils/service-mocks';

describe('ComplianceRequirementsController', () => {
  let controller: ComplianceRequirementsController;
  let mockService: ComplianceRequirementsService;

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
  const txResponse = createMockTransactionResult<Asset>({ transactions: [] });
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
        .calledWith(ticker)
        .mockResolvedValue(mockComplianceRequirements);

      const result = await controller.getComplianceRequirements({ ticker: 'TICKER' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual(new ComplianceRequirementsModel(mockComplianceRequirements as any));
    });
  });

  describe('setRequirements', () => {
    it('should accept SetRulesDto and set new Asset Compliance Rules', async () => {
      const response = createMockTransactionResult<Asset>({ transactions: [] });

      when(mockService.setRequirements)
        .calledWith(ticker, validBody as SetRequirementsDto)
        .mockResolvedValue(response);

      const result = await controller.setRequirements({ ticker }, validBody as SetRequirementsDto);
      expect(result).toEqual(response);
    });
  });

  describe('pauseRequirements', () => {
    it('should accept TransactionBaseDto and pause Asset Compliance Rules', async () => {
      when(mockService.pauseRequirements)
        .calledWith(ticker, validBody as TransactionBaseDto)
        .mockResolvedValue(txResponse);

      const result = await controller.pauseRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );
      expect(result).toEqual(txResponse);
    });
  });

  describe('unpauseRequirements', () => {
    it('should accept TransactionBaseDto and unpause Asset Compliance Rules', async () => {
      when(mockService.unpauseRequirements)
        .calledWith(ticker, validBody as TransactionBaseDto)
        .mockResolvedValue(txResponse);

      const result = await controller.pauseRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );
      expect(result).toEqual(txResponse);
    });
  });

  describe('deleteRequirement', () => {
    it('should accept TransactionBaseDto and compliance requirement ID and delete the corresponding Asset Compliance rule for the given ticker', async () => {
      when(mockService.deleteOne)
        .calledWith(ticker, new BigNumber(1), validBody as TransactionBaseDto)
        .mockResolvedValue(txResponse);

      const result = await controller.deleteRequirement(
        { ticker, id },
        validBody as TransactionBaseDto
      );

      expect(result).toEqual(txResponse);
    });
  });

  describe('deleteRequirements', () => {
    it('should accept TransactionBaseDto and delete all the Asset Compliance rules for the given ticker', async () => {
      when(mockService.deleteAll)
        .calledWith(ticker, validBody as TransactionBaseDto)
        .mockResolvedValue(txResponse);

      const result = await controller.deleteRequirements(
        { ticker },
        validBody as TransactionBaseDto
      );

      expect(result).toEqual(txResponse);
    });
  });

  describe('addRequirement', () => {
    it('should accept RequirementDto and add an Asset Compliance rule', async () => {
      const { signer, requirements } = validBody;

      when(mockService.add)
        .calledWith(ticker, {
          signer,
          conditions: requirements[0],
        } as RequirementDto)
        .mockResolvedValue(txResponse);

      const result = await controller.addRequirement({ ticker }, {
        signer,
        conditions: requirements[0],
      } as RequirementDto);
      expect(result).toEqual(txResponse);
    });
  });

  describe('modifyComplianceRequirement', () => {
    it('should accept RequirementDto and modify the corresponding Asset Compliance rule', async () => {
      const response = createMockTransactionResult<void>({ transactions: [] });
      const { signer, requirements } = validBody;

      when(mockService.modify)
        .calledWith(ticker, id, {
          signer,
          conditions: requirements[0],
        } as RequirementDto)
        .mockResolvedValue(response);

      const result = await controller.modifyComplianceRequirement({ ticker, id }, {
        signer,
        conditions: requirements[0],
      } as RequirementDto);

      expect(result).toEqual(response);
    });
  });

  describe('areRequirementsPaused', () => {
    it('should return the result of arePaused method', async () => {
      const response = false;

      when(mockService.arePaused).calledWith(ticker).mockResolvedValue(response);

      const result = await controller.areRequirementsPaused({ ticker });

      expect(result).toEqual(response);
    });
  });
});
