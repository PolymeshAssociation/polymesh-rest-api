import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { MockPolymeshClass } from '~/test-utils/mocks';

import { IdentitiesService } from './identities.service';

describe('IdentitiesService', () => {
  let service: IdentitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentitiesService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(new MockPolymeshClass())
      .compile();

    service = module.get<IdentitiesService>(IdentitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
