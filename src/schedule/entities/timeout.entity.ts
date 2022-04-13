export class TimeoutEntity {
  public id: string;

  public timeout: NodeJS.Timeout;

  public triesLeft: number;

  constructor(entity: TimeoutEntity) {
    Object.assign(this, entity);
  }
}
