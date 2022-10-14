/**
 * Placeholder for User when this module is added
 */
export type UserId = string;

export interface User {
  id: UserId;
  apiKeys: string[];
}

export const openAuthUser = { id: 'open-user', apiKeys: [] };
