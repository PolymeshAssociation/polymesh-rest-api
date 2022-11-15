import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { testUser } from '~/test-utils/consts';
import { mockUserServiceProvider } from '~/test-utils/service-mocks';
import { UsersController } from '~/users/users.controller';
import { UsersService } from '~/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: DeepMocked<UsersService>;

  beforeEach(async () => {
    mockUsersService = mockUserServiceProvider.useValue as DeepMocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [mockUserServiceProvider],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    const params = { name: testUser.name };
    it('should call the service and return the result', () => {
      when(mockUsersService.createUser).calledWith(params).mockResolvedValue(testUser);

      return expect(controller.createUser(params)).resolves.toEqual(testUser);
    });
  });
});
