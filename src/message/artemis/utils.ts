/* istanbul ignore file */

export type ArtemisConfig =
  | {
      type: 'artemis';
      port: number;
      host: string;
      username: string;
      password: string;
      operationTimeoutInSeconds: number;
      transport: string;
      configured: true;
    }
  | {
      type: 'artemis';
      configured: false;
    };

export const readArtemisFromEnv = (): ArtemisConfig => {
  const {
    ARTEMIS_HOST: host,
    ARTEMIS_PORT: port,
    ARTEMIS_USERNAME: username,
    ARTEMIS_PASSWORD: password,
  } = process.env;

  if (!host || !port || !username || !password) {
    return { type: 'artemis', configured: false };
  }

  return {
    type: 'artemis',
    host,
    username,
    port: Number(port),
    password,
    operationTimeoutInSeconds: 10,
    transport: 'tcp',
    configured: true,
  };
};
