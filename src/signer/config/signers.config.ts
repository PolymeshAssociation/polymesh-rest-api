/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('signer-accounts', () => {
  const { RELAYER_DIDS, RELAYER_MNEMONICS, VAULT_URL, VAULT_TOKEN } = process.env;

  if (VAULT_URL && VAULT_TOKEN) {
    const vault = {
      url: VAULT_URL,
      token: VAULT_TOKEN,
    };
    return { vault };
  }

  const dids = RELAYER_DIDS?.split(',').map(d => d.trim()) || [];
  const mnemonics = RELAYER_MNEMONICS?.split(',').map(m => m.trim()) || [];

  const accounts: Record<string, string> = {};

  dids.forEach((did, index) => {
    accounts[did] = mnemonics[index];
  });

  return {
    local: accounts,
  };
});
