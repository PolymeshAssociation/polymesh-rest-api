/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
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

  public claims = {
    getIssuedClaims: jest.fn(),
    getIdentitiesWithClaims: jest.fn(),
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

export class MockPortfolio {
  id = new BigNumber(1);
  public getName = jest.fn();
  public getTokenBalances = jest.fn();
  public isCustodiedBy = jest.fn();
  public getCustodian = jest.fn();
}

export class MockIdentityAuthorization {
  public getSent = jest.fn();
  public getReceived = jest.fn();
}

export class MockPortfolios {
  public getPortfolios = jest.fn();
}

export class MockIdentityClass {
  portfolios = new MockPortfolios();
  authorizations = new MockIdentityAuthorization();
  public getPrimaryKey = jest.fn();
  public areSecondaryKeysFrozen = jest.fn();
  public getPendingInstructions = jest.fn();
  public getVenues = jest.fn();
  public getSecondaryKeys = jest.fn();
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
