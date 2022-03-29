import { SignerService } from '~/signer/signer.service';
import { MockSignerService } from '~/test-utils/service-mocks';

export const mockSignerProvider = {
  provide: SignerService,
  useValue: new MockSignerService(),
};
