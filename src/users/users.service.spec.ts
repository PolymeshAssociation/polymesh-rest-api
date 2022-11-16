import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { testValues } from '~/test-utils/consts';
import { mockUserRepoProvider } from '~/test-utils/repo-mocks';
import { UsersRepo } from '~/users/repo/user.repo';
import { UsersService } from '~/users/users.service';

const { user } = testValues;

describe('UsersService', () => {
  let service: UsersService;
  let mockUsersRepo: DeepMocked<UsersRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockUserRepoProvider, UsersService],
    }).compile();

    mockUsersRepo = mockUserRepoProvider.useValue as DeepMocked<UsersRepo>;

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: getByName', () => {
    it('should return the User', async () => {
      when(mockUsersRepo.findByName).calledWith(user.name).mockResolvedValue(user);

      const foundUser = await service.getByName(user.name);

      expect(foundUser).toEqual(user);
    });
  });

  describe('method: createUser', () => {
    const params = { name: user.name };

    it('should create and return a User', async () => {
      when(mockUsersRepo.createUser).calledWith(params).mockResolvedValue(user);

      const createdUser = await service.createUser(params);

      expect(createdUser).toEqual(user);
    });
  });
});
