/* istanbul ignore file */

import { TxTag } from '@polymathnetwork/polymesh-sdk/types';

export type Mocked<T> = T &
  {
    [K in keyof T]: T[K] extends (...args: infer Args) => unknown
      ? T[K] & jest.Mock<ReturnType<T[K]>, Args>
      : T[K];
  };

/* Polymesh SDK */

export class MockPolymeshClass {
  public static create = jest.fn().mockResolvedValue(new MockPolymeshClass());

  public getSecurityTokens = jest.fn();
  public getSecurityToken = jest.fn();
  public getIdentity = jest.fn();
  public getLatestBlock = jest.fn();
  public isIdentityValid = jest.fn();
  public disconnect = jest.fn();
  public addSigner = jest.fn();
  public settlements = {
    getInstruction: jest.fn(),
    getVenue: jest.fn(),
  };
}

export class MockSecurityTokenClass {
  public details = jest.fn();
}

export class MockInstructionClass {
  public getStatus = jest.fn();
  public affirm = jest.fn();
}

export class MockVenueClass {
  public addInstruction = jest.fn();
}

export class MockIdentityClass {
  public getPendingInstructions = jest.fn();
}

export class MockTransactionQueueClass {
  constructor(public readonly transactions: { blockHash: string; txHash: string; tag: TxTag }[]) {}

  public run = jest.fn();
}

/* Services */

export class MockRelayerAccountsService {
  public findAddressByDid = jest.fn();

  public findAll = jest.fn().mockReturnValue([]);
}
