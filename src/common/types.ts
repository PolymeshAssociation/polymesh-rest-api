/* istanbul ignore file */

export interface Entity<Serialized> {
  uuid: string;

  toHuman(): Serialized;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Class<T extends {} = {}> = new (...args: any[]) => T;

export enum TransactionType {
  Single = 'single',
  Batch = 'batch',
}

export enum CalendarUnit {
  Second = 'Second',
  Minute = 'Minute',
  Hour = 'Hour',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}

/**
 * determines how transactions are processed
 */
export enum ProcessMode {
  /**
   * Sign and submit the transaction to the chain. Responds when transaction is in a finalized block
   */
  Submit = 'submit',
  /**
   * Sign and submit the transaction to the chain. Responds immediately, and posts status updates as the transaction is processed
   */
  SubmitWithCallback = 'submitWithCallback',
  /**
   * Return an unsigned transaction payload
   */
  Offline = 'offline',
  /**
   * Perform transaction validation, but does not perform the transaction
   */
  DryRun = 'dryRun',

  AMQP = 'AMQP',
}
