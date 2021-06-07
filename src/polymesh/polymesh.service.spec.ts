import { Test, TestingModule } from '@nestjs/testing';
import { PolymeshService } from './polymesh.service';

describe('PolymeshService', () => {
  let service: PolymeshService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolymeshService],
    }).compile();

    service = module.get<PolymeshService>(PolymeshService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
