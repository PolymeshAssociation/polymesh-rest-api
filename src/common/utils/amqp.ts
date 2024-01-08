/**
 * Sendable locations for messages
 */
export enum AddressName {
  Requests = 'Requests',
  Signatures = 'Signatures',
  Finalizations = 'Finalizations',
}

/**
 * Subscribable locations for messages
 */
export enum QueueName {
  EventsLog = 'EventsLog',

  Requests = 'Requests',
  SignerRequests = 'SignerRequests',
  SubmitterRequests = 'SubmitterRequests',

  Signatures = 'Signatures',
}
