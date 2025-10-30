import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthorizationRequest,
  CustomPermissionGroup,
  PermissionGroupType,
  TxGroup,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { BigNumber } from 'bignumber.js';

import { createAuthorizationRequestModel } from '~/authorizations/authorizations.util';
import { ResultsModel } from '~/common/models/results.model';
import { ServiceReturn } from '~/common/utils';
import { AssignAgentToGroupDto } from '~/permission-groups/dto/assign-agent-to-group.dto';
import { CheckPermissionsResultModel } from '~/permission-groups/models/check-permissions-result.model';
import { PermissionGroupWithPermissionsModel } from '~/permission-groups/models/permission-group-with-permissions.model';
import { PermissionGroupsController } from '~/permission-groups/permission-groups.controller';
import {
  GroupWithPermissions,
  PermissionGroupsService,
  PermissionGroupWithPermissions,
} from '~/permission-groups/permission-groups.service';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockAuthorizationRequest } from '~/test-utils/mocks';

describe('PermissionGroupsController', () => {
  let controller: PermissionGroupsController;
  const { signer, txResult, assetId, did } = testValues;
  const mockPermissionGroupsService = createMock<PermissionGroupsService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionGroupsController],
      providers: [PermissionGroupsService],
    })
      .overrideProvider(PermissionGroupsService)
      .useValue(mockPermissionGroupsService)
      .compile();

    controller = module.get<PermissionGroupsController>(PermissionGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGroup', () => {
    it('should call the service and return the results', async () => {
      const mockGroup = createMock<CustomPermissionGroup>({ id: 'someId' });

      mockPermissionGroupsService.createPermissionGroup.mockResolvedValue({
        ...txResult,
        result: mockGroup,
      });

      const result = await controller.createGroup(
        { asset: assetId },
        { signer, transactionGroups: [TxGroup.CapitalDistribution] }
      );

      expect(result).toEqual({ ...processedTxResult, id: mockGroup.id });
    });
  });

  describe('getPermissionGroups', () => {
    it('should call the service and return the results', async () => {
      const permissions = {
        transactions: null,
        transactionGroups: [TxGroup.CapitalDistribution],
      };
      const mockResult: PermissionGroupWithPermissions[] = [
        { type: PermissionGroupType.Full, permissions },
        { id: new BigNumber(1), permissions },
      ];

      mockPermissionGroupsService.getPermissionGroups.mockResolvedValue(mockResult);

      const result = await controller.getPermissionGroupsWithPermissions({ asset: assetId });

      expect(result).toEqual(
        new ResultsModel({
          results: mockResult.map(group => new PermissionGroupWithPermissionsModel(group)),
        })
      );
    });
  });

  describe('inviteAgent', () => {
    it('should call the service and return the results', async () => {
      const mockAuthorization = new MockAuthorizationRequest();
      const mockData = {
        ...txResult,
        result: mockAuthorization,
      };
      mockPermissionGroupsService.inviteAgentToGroup.mockResolvedValue(
        mockData as unknown as ServiceReturn<AuthorizationRequest>
      );

      const result = await controller.inviteAgent(
        { asset: assetId },
        { signer, target: '0x1000', permissions: new BigNumber(1) }
      );

      expect(result).toEqual({
        ...processedTxResult,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authorizationRequest: createAuthorizationRequestModel(mockAuthorization as any),
      });
    });
  });

  describe('assignAgentToGroup', () => {
    it('should call the service and return the results', async () => {
      mockPermissionGroupsService.assignAgentToGroup.mockResolvedValue(txResult);

      const params: AssignAgentToGroupDto = {
        signer,
        target: '0x1000',
        permissions: new BigNumber(1),
      };
      const result = await controller.assignAgentToGroup({ asset: assetId }, params);

      expect(result).toEqual(processedTxResult);
      expect(mockPermissionGroupsService.assignAgentToGroup).toHaveBeenCalledWith(assetId, params);
    });
  });

  describe('removeAgent', () => {
    it('should call the service and return the results', async () => {
      mockPermissionGroupsService.removeAgentFromAsset.mockResolvedValue(txResult);

      const result = await controller.removeAgent({ asset: assetId }, { signer, target: '0x1000' });

      expect(result).toEqual(processedTxResult);
    });
  });

  describe('abdicateAgent', () => {
    it('should call the service and return the results', async () => {
      mockPermissionGroupsService.abdicateAgent.mockResolvedValue(txResult);

      const result = await controller.abdicateAgent({ asset: assetId }, { signer, identity: did });

      expect(result).toEqual(processedTxResult);
      expect(mockPermissionGroupsService.abdicateAgent).toHaveBeenCalledWith(
        assetId,
        expect.objectContaining({ signer, identity: did })
      );
    });
  });

  describe('getGroupPermissions', () => {
    it('should call the service and return the results', async () => {
      const mockResult = { id: new BigNumber(1), permissions: [] };
      mockPermissionGroupsService.getGroupPermissions.mockResolvedValue(
        mockResult as unknown as GroupWithPermissions
      );

      const result = await controller.getGroupPermissions({ asset: assetId, id: new BigNumber(1) });

      expect(result).toEqual(
        new PermissionGroupWithPermissionsModel(
          mockResult as unknown as PermissionGroupWithPermissionsModel
        )
      );
    });
  });

  describe('setPermissions', () => {
    it('should call the service and return the results', async () => {
      mockPermissionGroupsService.modifyPermissions.mockResolvedValue({
        ...txResult,
      });

      const result = await controller.setPermissions(
        { asset: assetId, id: new BigNumber(1) },
        { signer, transactionGroups: [TxGroup.CapitalDistribution] }
      );

      expect(result).toEqual(processedTxResult);
      expect(mockPermissionGroupsService.modifyPermissions).toHaveBeenCalledWith(
        assetId,
        new BigNumber(1),
        { signer, transactionGroups: [TxGroup.CapitalDistribution] }
      );
    });
  });

  describe('checkPermissions', () => {
    it('should call the service and return the results', async () => {
      const mockResult = {
        missingPermissions: [],
        result: true,
        message: undefined,
      };
      mockPermissionGroupsService.checkPermissions.mockResolvedValue(mockResult);

      const result = await controller.checkPermissions(
        { asset: assetId },
        { target: did, transactions: [TxTags.asset.Issue] }
      );

      expect(result).toEqual(new CheckPermissionsResultModel(mockResult));
    });
  });
});
