export enum SubscriptionStatus {
  /**
   * Not yet confirmed by receiver
   */
  Inactive = 'inactive',
  /**
   * Confirmed by receiver. URL is ready to receive subscriptions
   */
  Active = 'active',
  /**
   * Rejected by receiver (handshake was responded with a non-200 code or without secret in the headers after all retries)
   */
  Rejected = 'rejected',
  /**
   * Subscription lifecycle finished (i.e. transaction already finalized) or terminated manually
   */
  Done = 'done',
}
