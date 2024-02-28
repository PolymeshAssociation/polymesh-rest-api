/* istanbul ignore file */

export class ConfidentialAccountEntity {
  /**
   * Public key of ElGamal Key Pair
   */
  public confidentialAccount: string;

  public createdAt: Date;

  public updatedAt: Date;

  constructor(entity: ConfidentialAccountEntity) {
    Object.assign(this, entity);
  }
}
