/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  AuthorizationType,
  CalendarUnit,
  TransactionStatus,
  TxTag,
  TxTags,
} from '@polymathnetwork/polymesh-sdk/types';

export type Mocked<T> = T &
  {
    [K in keyof T]: T[K] extends (...args: infer Args) => unknown
      ? T[K] & jest.Mock<ReturnType<T[K]>, Args>
      : T[K];
  };

/* Polymesh SDK */

export class MockPolymesh {
  public static create = jest.fn().mockResolvedValue(new MockPolymesh());

  public disconnect = jest.fn();
  public setSigningManager = jest.fn();

  public network = {
    getLatestBlock: jest.fn(),
    transferPolyx: jest.fn(),
    getSs58Format: jest.fn(),
  };

  public assets = {
    getAsset: jest.fn(),
    getAssets: jest.fn(),
    reserveTicker: jest.fn(),
    createAsset: jest.fn(),
    getTickerReservation: jest.fn(),
    getTickerReservations: jest.fn(),
  };

  public accountManagement = {
    getAccount: jest.fn(),
    getAccountBalance: jest.fn(),
    inviteAccount: jest.fn(),
  };

  public identities = {
    isIdentityValid: jest.fn(),
    getIdentity: jest.fn(),
    createPortfolio: jest.fn(),
  };

  public settlements = {
    getInstruction: jest.fn(),
    getVenue: jest.fn(),
    createVenue: jest.fn(),
  };

  public claims = {
    getIssuedClaims: jest.fn(),
    getIdentitiesWithClaims: jest.fn(),
  };
}

export class MockAsset {
  ticker = 'TICKER';
  public details = jest.fn();
  public getIdentifiers = jest.fn();
  public currentFundingRound = jest.fn();
  public isFrozen = jest.fn();
  public redeem = jest.fn();
  public freeze = jest.fn();
  public unfreeze = jest.fn();

  public assetHolders = {
    get: jest.fn(),
  };

  public documents = {
    get: jest.fn(),
    set: jest.fn(),
  };

  public settlements = {
    canTransfer: jest.fn(),
  };

  public compliance = {
    requirements: {
      get: jest.fn(),
      set: jest.fn(),
    },
    trustedClaimIssuers: {
      get: jest.fn(),
    },
  };

  public offerings = {
    get: jest.fn(),
  };

  public checkpoints = {
    get: jest.fn(),
    create: jest.fn(),
    getOne: jest.fn(),

    schedules: {
      get: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    },
  };

  public corporateActions = {
    distributions: {
      get: jest.fn(),
      getOne: jest.fn(),
      configureDividendDistribution: jest.fn(),
    },
    getDefaultConfig: jest.fn(),
    setDefaultConfig: jest.fn(),
    remove: jest.fn(),
  };

  public issuance = {
    issue: jest.fn(),
  };

  public toJson = jest.fn().mockImplementation(() => this.ticker);
}

export class MockInstruction {
  public getStatus = jest.fn();
  public affirm = jest.fn();
  public reject = jest.fn();
  public details = jest.fn();
  public getLegs = jest.fn();
  public getAffirmations = jest.fn();
}

export class MockVenue {
  id = new BigNumber(1);
  public addInstruction = jest.fn();
  public details = jest.fn();
  public modify = jest.fn();
}

export class MockIdentityAuthorization {
  public getSent = jest.fn();
  public getReceived = jest.fn();
  public getOne = jest.fn();
}

export class MockPortfolios {
  public getPortfolios = jest.fn();
  public getPortfolio = jest.fn();
  public create = jest.fn();
  public delete = jest.fn();
}

export class MockIdentity {
  did = '0x06'.padEnd(66, '0');
  portfolios = new MockPortfolios();
  authorizations = new MockIdentityAuthorization();
  public getPrimaryAccount = jest.fn();
  public areSecondaryAccountsFrozen = jest.fn();
  public getPendingInstructions = jest.fn();
  public getVenues = jest.fn();
  public createVenue = jest.fn();
  public getSecondaryAccounts = jest.fn();
  public getTrustingAssets = jest.fn();
}

export class MockPortfolio {
  id = new BigNumber(1);
  owner = new MockIdentity();
  public getName = jest.fn();
  public getAssetBalances = jest.fn();
  public isCustodiedBy = jest.fn();
  public getCustodian = jest.fn();
  public moveFunds = jest.fn();
  public toJson = jest.fn().mockImplementation(() => {
    return {
      id: '1',
      did: '0x06'.padEnd(66, '0'),
    };
  });
}

export class MockCheckpoint {
  id = new BigNumber(1);
  ticker = 'TICKER';
  balance = jest.fn();
  allBalances = jest.fn();
  createdAt = jest.fn();
  totalSupply = jest.fn();
}

export class MockCheckpointSchedule {
  id = new BigNumber(1);
  ticker = 'TICKER';
  period = { unit: CalendarUnit.Month, amount: new BigNumber(3) };
  start = new Date('10/14/1987');
  expiryDate = new Date('10/14/2000');
  complexity = new BigNumber(4);
}

export class MockAuthorizationRequest {
  authId = new BigNumber(1);
  expiry = null;
  data = {
    type: AuthorizationType.PortfolioCustody,
    value: {
      did: '0x6'.padEnd(66, '1a'),
      id: new BigNumber(1),
    },
  };

  issuer = new MockIdentity();
  target = {
    did: '0x6'.padEnd(66, '1a'),
  };

  public accept = jest.fn();
  public remove = jest.fn();
}

export class MockTransactionQueue {
  constructor(
    public readonly transactions: {
      blockHash: string;
      txHash: string;
      tag: TxTag;
      blockNumber: BigNumber;
    }[]
  ) {}

  public run = jest.fn();
}

class MockPolymeshTransactionBase {
  blockHash?: string;
  txHash?: string;
  blockNumber?: BigNumber;
  status: TransactionStatus = TransactionStatus.Unapproved;
  error: Error;

  run = jest.fn().mockReturnValue(Promise.resolve());
  onStatusChange = jest.fn();
}
export class MockPolymeshTransaction extends MockPolymeshTransactionBase {
  tag: TxTag = TxTags.asset.RegisterTicker;
}

export class MockPolymeshTransactionBatch extends MockPolymeshTransactionBase {
  transactions: { tag: TxTag }[] = [
    {
      tag: TxTags.asset.RegisterTicker,
    },
    {
      tag: TxTags.asset.CreateAsset,
    },
  ];
}

export class MockOffering {
  id = new BigNumber(1);
  ticker = 'TICKER';
  public getInvestments = jest.fn();
}
export class MockTickerReservation {
  ticker = 'TICKER';

  public transferOwnership = jest.fn();
  public extend = jest.fn();
  public details = jest.fn();
}

export class MockAccount {
  address = 'address';
  getTransactionHistory = jest.fn();
  getPermissions = jest.fn();
}
