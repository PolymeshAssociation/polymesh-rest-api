export class IntervalEntity {
  public id: string;

  public interval: NodeJS.Timeout;

  constructor(entity: IntervalEntity) {
    Object.assign(this, entity);
  }
}
