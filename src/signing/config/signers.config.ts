/* istanbul ignore file */

import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';

export default registerAs('signer-accounts', () => {
  const {
    LOCAL_SIGNERS,
    LOCAL_MNEMONICS,
    VAULT_URL,
    VAULT_TOKEN,
    FIREBLOCKS_URL,
    FIREBLOCKS_API_KEY,
    FIREBLOCKS_SECRET_PATH,
  } = process.env;

  if (VAULT_URL && VAULT_TOKEN) {
    const vault = {
      url: VAULT_URL,
      token: VAULT_TOKEN,
    };
    return { vault };
  }

  if (FIREBLOCKS_URL && FIREBLOCKS_API_KEY && FIREBLOCKS_SECRET_PATH) {
    const secret = readFileSync(FIREBLOCKS_SECRET_PATH, 'utf8');
    const fireblocks = {
      url: FIREBLOCKS_URL,
      apiKey: FIREBLOCKS_API_KEY,
      secret,
    };

    return { fireblocks };
  }

  const signers = LOCAL_SIGNERS?.split(',').map(d => d.trim()) || [];
  const mnemonics = LOCAL_MNEMONICS?.split(',').map(m => m.trim()) || [];

  const accounts: Record<string, string> = {};

  signers.forEach((signer, index) => {
    accounts[signer] = mnemonics[index];
  });

  return {
    local: accounts,
  };
});
