import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { ScheduleService } from '~/schedule/schedule.service';
import { MockPolymesh } from '~/test-utils/mocks';
import { MockScheduleService } from '~/test-utils/service-mocks';

describe('PolymeshService', () => {
  let service: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  let mockScheduleService: MockScheduleService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockScheduleService = new MockScheduleService();

    mockScheduleService.addInterval.mockImplementation((_, cb) => cb());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolymeshService,
        { provide: POLYMESH_API, useValue: mockPolymeshApi },
        ScheduleService,
      ],
    })
      .overrideProvider(ScheduleService)
      .useValue(mockScheduleService)
      .compile();

    service = module.get<PolymeshService>(PolymeshService);
  });

  afterAll(async () => {
    await service.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add an interval to ping the node every 10 seconds', async () => {
    expect(mockPolymeshApi.network.getLatestBlock).toHaveBeenCalledTimes(1);
    expect(mockScheduleService.addInterval).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      10000
    );
  });
});
