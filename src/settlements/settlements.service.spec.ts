import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { IdentitiesModule } from '~/identities/identities.module';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { MockIdentityClass, MockPolymeshClass } from '~/test-utils/mocks';

import { SettlementsService } from './settlements.service';

describe('SettlementsService', () => {
  let service: SettlementsService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [IdentitiesModule, PolymeshModule, RelayerAccountsModule],
      providers: [SettlementsService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    service = module.get<SettlementsService>(SettlementsService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPendingInstructionsByDid', () => {
    it('should return a list of pending instructions', async () => {
      const mockIdentity = new MockIdentityClass();
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);

      const mockInstructions = [
        { id: new BigNumber(1) },
        { id: new BigNumber(2) },
        { id: new BigNumber(3) },
      ];

      mockIdentity.getPendingInstructions.mockResolvedValue(mockInstructions);

      const result = await service.findPendingInstructionsByDid('0x01');

      expect(result).toEqual(mockInstructions);
    });
  });
});
