import { UserModel } from '~/users/model/user.model';

const signer = 'alice';
const did = '0x01'.padEnd(66, '0');

const user = new UserModel({
  id: '-1',
  name: 'TestUtilUser',
});

const resource = {
  type: 'TestResource',
  id: '-1',
} as const;

export const testValues = {
  signer,
  did,
  user,
  resource,
};
