import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { PolymeshService } from './polymesh.service';

describe('PolymeshService', () => {
  let service: PolymeshService;
  let mockPolymeshApi: MockPolymeshClass;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymeshClass();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PolymeshService, { provide: POLYMESH_API, useValue: mockPolymeshApi }],
    }).compile();

    service = module.get<PolymeshService>(PolymeshService);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ping the node every 10 seconds', () => {
    jest.advanceTimersByTime(20000);

    expect(mockPolymeshApi.getLatestBlock).toHaveBeenCalledTimes(2);
  });
});
