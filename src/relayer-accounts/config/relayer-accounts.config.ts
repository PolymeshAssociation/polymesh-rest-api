/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('relayer-accounts', () => {
  const { RELAYER_DIDS, RELAYER_MNEMONICS } = process.env;

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const dids = RELAYER_DIDS?.split(',') || [];
  const mnemonics = RELAYER_MNEMONICS?.split(',') || [];
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const accounts: Record<string, string> = {};

  dids.forEach((did, index) => {
    accounts[did] = mnemonics[index];
  });

  return accounts;
});
