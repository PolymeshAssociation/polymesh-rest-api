/* istanbul ignore file */

import { registerAs } from '@nestjs/config';
import axios from 'axios';

export default registerAs('vault', () => {
  const { VAULT_TRANSIT_URL, VAULT_TOKEN, VAULT_KEYS, SS58_FORMAT } = process.env;
  let format = 42;
  if (SS58_FORMAT) {
    format = Number(SS58_FORMAT);
    if (isNaN(format)) throw new Error(`SS58_FORMAT: ${SS58_FORMAT} is not a number`);
  }

  // If using a vault singer, ensure all envs are set
  if (VAULT_TRANSIT_URL) {
    if (!VAULT_TOKEN || !VAULT_KEYS) {
      throw new Error(
        'If Vault is being used then VAULT_TOKEN and VAULT_KEYS must be set. Etiher set them or unset VAULT_TRANSIT_URL'
      );
    }
  }

  const client = axios.create({
    baseURL: VAULT_TRANSIT_URL,
    timeout: 3000,
    headers: { 'X-Vault-Token': VAULT_TOKEN || '' },
  });

  return {
    client,
    vaultKeys: VAULT_KEYS?.split(',') || [],
    ss58Format: format,
  };
});
