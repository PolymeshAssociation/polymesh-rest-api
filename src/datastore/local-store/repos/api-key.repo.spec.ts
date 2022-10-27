import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { LocalApiKeysRepo } from '~/datastore/local-store/repos/api-key.repo';
import { defaultUser } from '~/users/user.consts';

describe(`LocalApiKeyRepo meets ${ApiKeyRepo.type} test suite requirements`, () => {
  const mockConfig = createMock<ConfigService>();
  const repo = new LocalApiKeysRepo(mockConfig);

  ApiKeyRepo.test(repo);
});

describe('LocalApiKeyRepo', () => {
  const config = 'ConfiguredSecret';

  it('should be configured with keys from the config service', () => {
    const mockConfig = createMock<ConfigService>();
    mockConfig.getOrThrow.mockReturnValue(config);

    const repo = new LocalApiKeysRepo(mockConfig);

    return expect(repo.getUserByApiKey(config)).resolves.toEqual(defaultUser);
  });
});
