import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';

import { SigningService } from '~/signing/signing.service';
import { MockSigningService } from '~/test-utils/service-mocks';

/*
 * provides a mock HashicorpVaultSigningManager for testing
 */
export class MockHashicorpVaultSigningManager {
  externalSigner = jest.fn();
  getVaultKeys = jest.fn();
  getExternalSigner = jest.fn();
  getSs58Format = jest.fn();
  setSs58Format = jest.fn();
  getAccounts = jest.fn();
  vault = jest.fn();
}

Object.setPrototypeOf(MockHashicorpVaultSigningManager, HashicorpVaultSigningManager.prototype); // Lets mock pass `instanceof` checks

export const mockSigningProvider = {
  provide: SigningService,
  useValue: new MockSigningService(),
};
