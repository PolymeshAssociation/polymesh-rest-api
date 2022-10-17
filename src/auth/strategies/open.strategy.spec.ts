import { Test, TestingModule } from '@nestjs/testing';
import passport from 'passport';

import { OpenStrategy } from '~/auth/strategies/open.strategy';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';
import { openAuthUser } from '~/users/user.consts';

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
    let authorizedUser;
    passport.authenticate(AuthStrategy.Open, (request, user) => {
      authorizedUser = user;
    })({}, {}, {});

    expect(authorizedUser).toEqual(openAuthUser);
  });
});
