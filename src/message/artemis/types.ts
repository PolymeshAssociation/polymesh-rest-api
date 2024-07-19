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
  | { type: 'artemis'; configured: false };
