/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('confidential-proofs', () => {
  const { PROOF_SERVER_URL } = process.env;

  return {
    proofServerUrl: PROOF_SERVER_URL || '',
  };
});
