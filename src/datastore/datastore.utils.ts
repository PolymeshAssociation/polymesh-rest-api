/* istanbul ignore file */

export interface PostgresConfig {
  type: 'postgres';
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
}

export const readPostgresConfig = (): PostgresConfig | undefined => {
  const {
    REST_POSTGRES_HOST: host,
    REST_POSTGRES_PORT: port,
    REST_POSTGRES_USER: username,
    REST_POSTGRES_PASSWORD: password,
    REST_POSTGRES_DATABASE: database,
  } = process.env;

  if (!host || !port || !username || !password || !database) {
    return undefined;
  }

  return { type: 'postgres', host, username, port: Number(port), password, database };
};
