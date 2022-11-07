import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { testUser } from '~/test-utils/consts';
import { mockUserRepoProvider } from '~/test-utils/repo-mocks';
import { UsersRepo } from '~/users/repo/user.repo';
import { UsersService } from '~/users/users.service';

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
      when(mockUsersRepo.findByName).calledWith(testUser.name).mockResolvedValue(testUser);

      const foundUser = await service.getByName(testUser.name);

      expect(foundUser).toEqual(testUser);
    });
  });

  describe('method: createUser', () => {
    const params = { name: testUser.name };

    it('should create and return a User', async () => {
      when(mockUsersRepo.createUser).calledWith(params).mockResolvedValue(testUser);

      const createdUser = await service.createUser(params);

      expect(createdUser).toEqual(testUser);
    });
  });
});
