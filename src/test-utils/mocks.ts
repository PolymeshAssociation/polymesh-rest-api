export type Mocked<T> = T &
  {
    [K in keyof T]: T[K] extends (...args: infer Args) => unknown
      ? T[K] & jest.Mock<ReturnType<T[K]>, Args>
      : T[K];
  };

export class MockPolymeshClass {
  public static create = jest.fn().mockResolvedValue(new MockPolymeshClass());

  public getSecurityTokens = jest.fn();
  public getSecurityToken = jest.fn();
  public getIdentity = jest.fn();
  public getLatestBlock = jest.fn();
}

export class MockSecurityTokenClass {
  public details = jest.fn();
}