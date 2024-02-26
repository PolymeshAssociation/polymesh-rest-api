/* istanbul ignore file */

export class ConfidentialAccountEntity {
  /**
   * Public key of ElGamal Key Pair
   */
  public confidential_account: string;

  public created_at: Date;

  public updated_at: Date;

  constructor(entity: ConfidentialAccountEntity) {
    Object.assign(this, entity);
  }
}
