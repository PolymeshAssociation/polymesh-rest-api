/* istanbul ignore file */

import { registerAs } from '@nestjs/config';

export default registerAs('proof-server', () => {
  const { PROOF_SERVER_API } = process.env;

  return {
    proofServerApi: PROOF_SERVER_API,
  };
});
