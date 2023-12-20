/* istanbul ignore file */

/**
 * Model that will accept any params. Used as a helper for recording arbitrary events
 */
export class AnyModel {
  constructor(params: object) {
    Object.assign(this, params);
  }
}
