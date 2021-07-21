import { forwardRef } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { IdentitiesModule } from '~/identities/identities.module';
import { IdentitiesService } from '~/identities/identities.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { MockIdentityClass,MockPolymeshClass  } from '~/test-utils/mocks';


describe('PortfoliosService', () => {
  let service: PortfoliosService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;
  const mockIdentitiesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();
    const module: TestingModule = await Test.createTestingModule({
      imports: [forwardRef(() => IdentitiesModule)],
      providers: [PortfoliosService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .overrideProvider(IdentitiesService)
      .useValue(mockIdentitiesService)
      .compile();

    service = module.get<PortfoliosService>(PortfoliosService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOwner', () => {
    it('should return a list of Portfolios for a given DID', async () => {
      const mockIdentity = new MockIdentityClass();
      const did = '0x6'.padEnd(66, '0');
      const mockPortfolios = [
        {
          name: 'Default',
          tokenBalances: [
            {
              ticker: 'TICKER',
            },
          ],
        },
        {
          id: new BigNumber(1),
          name: 'TEST',
          tokenBalances: [],
        },
      ];
      mockIdentity.portfolios.getPortfolios.mockResolvedValue(mockPortfolios);
      mockIdentitiesService.findOne.mockReturnValue(mockIdentity);
      const result = await service.findAllByOwner(did);
      expect(result).toEqual(mockPortfolios);
    });
  });
});
