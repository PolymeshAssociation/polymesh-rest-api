import { TypeORMError } from 'typeorm';

import { AppConflictError } from '~/common/errors';

const isTypeOrmError = (err: Error): err is TypeORMError => {
  return err instanceof TypeORMError;
};
export const convertTypeOrmErrorToAppError =
  (id: string, resourceType: string) =>
  (err: Error): void => {
    if (isTypeOrmError(err)) {
      const { message } = err;
      if (message.includes('duplicate key value violates unique constraint')) {
        throw new AppConflictError(id, resourceType);
      }
    }

    throw err;
  };
