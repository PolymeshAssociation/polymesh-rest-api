import { Test, TestingModule } from '@nestjs/testing';

import { OpenStrategy } from '~/auth/strategies/open.strategy';
import { defaultUser } from '~/users/user.consts';

describe('OpenStrategy', () => {
  let strategy: OpenStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenStrategy],
    }).compile();

    strategy = module.get<OpenStrategy>(OpenStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should verify with the open user', async () => {
    // Test the validate method directly
    const result = strategy.validate();
    expect(result).toEqual(defaultUser);
  });
});
