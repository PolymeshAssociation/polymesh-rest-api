/* istanbul ignore file */

import { IsOptional } from 'class-validator';

/**
 * Model that will accept any params. Used as a helper for recording arbitrary events
 */
export class AnyModel {
  @IsOptional()
  data?: unknown;

  constructor(params: object) {
    Object.assign(this, params);
  }
}
