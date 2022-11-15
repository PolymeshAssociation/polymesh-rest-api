/* istanbul ignore file */

export interface PostgresConfig {
  type: 'postgres';
  host: string;
  username: string;
  password: string;
  database: string;
  port: number;
}
