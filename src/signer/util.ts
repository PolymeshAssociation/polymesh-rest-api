import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

export function isLocalSigningManager(manager: SigningManager): manager is LocalSigningManager {
  return manager instanceof LocalSigningManager;
}

export function isVaultSigningManager(
  manager: SigningManager
): manager is HashicorpVaultSigningManager {
  return manager instanceof HashicorpVaultSigningManager;
}
