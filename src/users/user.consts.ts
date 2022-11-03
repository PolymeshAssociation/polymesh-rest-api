import { UserModel } from '~/users/model/user.model';

export const defaultUser = new UserModel({
  id: '-1',
  name: 'DefaultUser',
});
