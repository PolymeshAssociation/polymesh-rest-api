/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('signer-accounts', () => {
  const { LOCAL_SIGNERS, LOCAL_MNEMONICS, VAULT_URL, VAULT_TOKEN } = process.env;

  if (VAULT_URL && VAULT_TOKEN) {
    const vault = {
      url: VAULT_URL,
      token: VAULT_TOKEN,
    };
    return { vault };
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
