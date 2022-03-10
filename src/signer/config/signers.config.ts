/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('signer-accounts', () => {
  const { RELAYER_DIDS, RELAYER_MNEMONICS } = process.env;

  const dids = RELAYER_DIDS?.split(',').map(d => d.trim()) || [];
  const mnemonics = RELAYER_MNEMONICS?.split(',').map(m => m.trim()) || [];

  const accounts: Record<string, string> = {};

  dids.forEach((did, index) => {
    accounts[did] = mnemonics[index];
  });

  return accounts;
});
