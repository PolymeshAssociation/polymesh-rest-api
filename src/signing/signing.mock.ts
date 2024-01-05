/* istanbul ignore file */

import { createMock } from '@golevelup/ts-jest';
import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';

import { SigningService } from '~/signing/services';

/**
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

export class MockFireblocksSigningManager {
  externalSigner = jest.fn();
  getExternalSigner = jest.fn();
  setSs58Format = jest.fn();
  getAccounts = jest.fn();
  deriveAccount = jest.fn();
  fireblocksClient = jest.fn();
  ss58Format = 42;
}

Object.setPrototypeOf(MockFireblocksSigningManager, FireblocksSigningManager.prototype); // Lets mock pass `instanceof` checks

export const mockSigningProvider = {
  provide: SigningService,
  useValue: createMock<SigningService>(),
};
