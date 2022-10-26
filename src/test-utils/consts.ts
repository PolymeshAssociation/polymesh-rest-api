import { UserModel } from '~/users/model/user.model';

export const testUser = new UserModel({
  id: '-1',
  name: 'TestUtilUser',
});

export const testResource = {
  type: 'TestResource',
  id: '-1',
} as const;
