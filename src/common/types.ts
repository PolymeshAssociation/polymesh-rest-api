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
