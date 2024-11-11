/* istanbul ignore file */

import { createMock, DeepMocked, PartialFuncReturn } from '@golevelup/ts-jest';
import { ValueProvider } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AuthorizationType,
  HistoricSettlement,
  MetadataEntry,
  MetadataType,
  MultiSig,
  MultiSigProposal,
  ResultSet,
  SettlementLeg,
  SettlementResultEnum,
  Subsidy,
  TransactionStatus,
  TrustedClaimIssuer,
  TxTag,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { Response } from 'express';

import { TransactionType } from '~/common/types';
import { ServiceReturn } from '~/common/utils';
import { EventType } from '~/events/types';
import { NotificationPayload } from '~/notifications/types';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues, txResult } from '~/test-utils/consts';
import { TransactionResult } from '~/transactions/transactions.util';

const { did } = testValues;

export type Mocked<T> = T & {
  [K in keyof T]: T[K] extends (...args: infer Args) => unknown
    ? T[K] & jest.Mock<ReturnType<T[K]>, Args>
    : T[K];
};

export const mockTrustedClaimIssuer = createMock<TrustedClaimIssuer<true>>();

export const createMockTransactionResult = <T>({
  details,
  transactions,
  result,
}: {
  details: TransactionResult<T>['details'];
  transactions: TransactionResult<T>['transactions'];
  result?: TransactionResult<T>['result'];
}): DeepMocked<TransactionResult<T>> => {
  return { transactions, result, details } as DeepMocked<TransactionResult<T>>;
};

export const createMockResponseObject = (): DeepMocked<Response> => {
  return createMock<Response>({
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  });
};

export const MockPolymeshService = createMock<PolymeshService>();

export const mockPolymeshServiceProvider: ValueProvider<PolymeshService> = {
  provide: PolymeshService,
  useValue: createMock<PolymeshService>(),
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
    getNetworkProperties: jest.fn(),
    getTreasuryAccount: jest.fn(),
    getTransactionByHash: jest.fn(),
    submitTransaction: jest.fn(),
    getMiddlewareMetadata: jest.fn(),
  };

  public assets = {
    getFungibleAsset: jest.fn(),
    getAssets: jest.fn(),
    getAsset: jest.fn(),
    getNftCollection: jest.fn(),
    reserveTicker: jest.fn(),
    createAsset: jest.fn(),
    getTickerReservation: jest.fn(),
    getTickerReservations: jest.fn(),
    getGlobalMetadataKeys: jest.fn(),
  };

  public accountManagement = {
    getAccount: jest.fn(),
    getAccountBalance: jest.fn(),
    inviteAccount: jest.fn(),
    freezeSecondaryAccounts: jest.fn(),
    unfreezeSecondaryAccounts: jest.fn(),
    revokePermissions: jest.fn(),
    modifyPermissions: jest.fn(),
    subsidizeAccount: jest.fn(),
    getSubsidy: jest.fn(),
    isValidAddress: jest.fn(),
    createMultiSigAccount: jest.fn(),
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
    addInstruction: jest.fn(),
  };

  public claims = {
    getIssuedClaims: jest.fn(),
    getIdentitiesWithClaims: jest.fn(),
    addClaims: jest.fn(),
    editClaims: jest.fn(),
    revokeClaims: jest.fn(),
    getCddClaims: jest.fn(),
    getClaimScopes: jest.fn(),
    addInvestorUniquenessClaim: jest.fn(),
    getInvestorUniquenessClaims: jest.fn(),
    getCustomClaimTypeByName: jest.fn(),
    getCustomClaimTypeById: jest.fn(),
    registerCustomClaimType: jest.fn(),
    getAllCustomClaimTypes: jest.fn(),
  };

  public _polkadotApi = {
    tx: {
      balances: {
        transfer: jest.fn(),
        setBalance: jest.fn(),
      },
      cddServiceProviders: {
        addMember: jest.fn(),
      },
      identity: {
        addClaim: jest.fn(),
        cddRegisterDid: jest.fn(),
      },
      sudo: {
        sudo: jest.fn(),
      },
      testUtils: {
        mockCddRegisterDid: jest.fn().mockReturnValue({
          signAndSend: jest.fn(),
        }),
      },
      utility: {
        batchAll: jest.fn(),
      },
    },
  };
}

export class MockAsset {
  id = '3616b82e-8e10-80ae-dc95-2ea28b9db8b3';
  ticker = 'TICKER';
  public details = jest.fn();
  public getIdentifiers = jest.fn();
  public currentFundingRound = jest.fn();
  public isFrozen = jest.fn();
  public transferOwnership = jest.fn();
  public redeem = jest.fn();
  public freeze = jest.fn();
  public unfreeze = jest.fn();
  public controllerTransfer = jest.fn();
  public getOperationHistory = jest.fn();
  public getRequiredMediators = jest.fn();
  public addRequiredMediators = jest.fn();
  public removeRequiredMediators = jest.fn();
  public linkTicker = jest.fn();
  public unlinkTicker = jest.fn();

  public assetHolders = {
    get: jest.fn(),
  };

  public documents = {
    get: jest.fn(),
    set: jest.fn(),
  };

  public settlements = {
    canTransfer: jest.fn(),
    preApprove: jest.fn(),
    removePreApproval: jest.fn(),
  };

  public compliance = {
    requirements: {
      get: jest.fn(),
      set: jest.fn(),
      arePaused: jest.fn(),
    },
    trustedClaimIssuers: {
      get: jest.fn(),
      set: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
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
      maxComplexity: jest.fn(),
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

  public metadata = {
    register: jest.fn(),
    get: jest.fn(),
    getOne: jest.fn(),
  };

  public toHuman = jest.fn().mockImplementation(() => this.ticker);
}

export class MockInstruction {
  public getStatus = jest.fn();
  public affirm = jest.fn();
  public reject = jest.fn();
  public details = jest.fn();
  public getLegs = jest.fn();
  public getAffirmations = jest.fn();
  public getOffChainAffirmations = jest.fn();
  public getOffChainAffirmationForLeg = jest.fn();
  public withdraw = jest.fn();
  public reschedule = jest.fn();
  public getMediators = jest.fn();
  public affirmAsMediator = jest.fn();
  public rejectAsMediator = jest.fn();
  public withdrawAsMediator = jest.fn();
  public generateOffChainAffirmationReceipt = jest.fn();
  public toHuman = jest.fn().mockImplementation(() => {
    return {
      id: '1',
      did,
    };
  });
}

export class MockVenue {
  id = new BigNumber(1);
  public addInstruction = jest.fn();
  public details = jest.fn();
  public modify = jest.fn();
  public getAllowedSigners = jest.fn();
  public addSigners = jest.fn();
  public removeSigners = jest.fn();
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
  public getCustodiedPortfolios = jest.fn();
}

export class MockIdentity {
  did = did;
  portfolios = new MockPortfolios();
  authorizations = new MockIdentityAuthorization();
  public getPrimaryAccount = jest.fn();
  public areSecondaryAccountsFrozen = jest.fn();
  public getInstructions = jest.fn();
  public getVenues = jest.fn();
  public createVenue = jest.fn();
  public getSecondaryAccounts = jest.fn();
  public getTrustingAssets = jest.fn();
  public getHeldAssets = jest.fn();
  public preApprovedAssets = jest.fn();
  public isAssetPreApproved = jest.fn();
}

export class MockPortfolio {
  id = new BigNumber(1);
  owner = new MockIdentity();
  public getName = jest.fn();
  public createdAt = jest.fn();
  public getAssetBalances = jest.fn();
  public isCustodiedBy = jest.fn();
  public getCustodian = jest.fn();
  public setCustodian = jest.fn();
  public moveFunds = jest.fn();
  public getTransactionHistory = jest.fn();
  public quitCustody = jest.fn();
  public toHuman = jest.fn().mockImplementation(() => {
    return {
      id: '1',
      did,
    };
  });
}

export class MockCheckpoint {
  id = new BigNumber(1);
  assetId = testValues.assetId;
  balance = jest.fn();
  allBalances = jest.fn();
  createdAt = jest.fn();
  totalSupply = jest.fn();
}

export class MockCheckpointSchedule {
  id = new BigNumber(1);
  assetId = testValues.assetId;
  pendingPoints = [new Date('10/14/1987')];
  expiryDate = new Date('10/14/2000');
  getCheckpoints = jest.fn();
}

export class MockAuthorizationRequest {
  authId = new BigNumber(1);
  expiry = null;
  data = {
    type: AuthorizationType.PortfolioCustody,
    value: {
      did,
      id: new BigNumber(1),
    },
  };

  issuer = new MockIdentity();
  target = {
    did,
  };

  public accept = jest.fn();
  public remove = jest.fn();
}

export class MockTransaction {
  constructor(
    readonly transaction: {
      blockHash: string;
      txHash: string;
      tag: TxTag;
      blockNumber: BigNumber;
    }
  ) {
    Object.assign(this, transaction);
  }

  public run = jest.fn();
}

export class MockHistoricSettlement {
  constructor(
    readonly settlement?: {
      blockNumber?: BigNumber;
      blockHash?: string;
      accounts?: Account[];
      legs?: SettlementLeg[];
    }
  ) {
    const defaultValue: HistoricSettlement = {
      blockNumber: new BigNumber(1),
      blockHash: '0x1',
      status: SettlementResultEnum.Executed,
      accounts: [],
      legs: [],
    };

    Object.assign(this, { ...defaultValue, ...settlement });
  }
}

class MockPolymeshTransactionBase {
  blockHash?: string;
  txHash?: string;
  blockNumber?: BigNumber;
  multiSig?: MultiSig;
  status: TransactionStatus = TransactionStatus.Unapproved;
  error: Error;
  getTotalFees = jest.fn().mockResolvedValue({
    total: new BigNumber(1),
    payingAccountData: { account: { address: 'address' } },
  });

  supportsSubsidy = jest.fn().mockReturnValue(false);
  run = jest.fn().mockReturnValue(Promise.resolve());
  runAsProposal = jest.fn().mockReturnValue(Promise.resolve(createMock<MultiSigProposal>()));
  toSignablePayload = jest.fn();
  onStatusChange = jest.fn();
}
export class MockPolymeshTransaction extends MockPolymeshTransactionBase {
  tag: TxTag = TxTags.asset.RegisterUniqueTicker;
}

export class MockPolymeshTransactionBatch extends MockPolymeshTransactionBase {
  transactions: { tag: TxTag }[] = [
    {
      tag: TxTags.asset.RegisterUniqueTicker,
    },
    {
      tag: TxTags.asset.CreateAsset,
    },
  ];
}

export type CallbackFn<T extends MockPolymeshTransactionBase> = (tx: T) => Promise<void>;

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

export class MockAuthorizations {
  getOne = jest.fn();
}
export class MockAccount {
  address: string;
  authorizations = new MockAuthorizations();
  getTransactionHistory = jest.fn();
  getPermissions = jest.fn();
  getIdentity = jest.fn();
  getSubsidy = jest.fn();
  getMultiSig = jest.fn();
  getOffChainReceipts = jest.fn();
  subsidies = {
    getSubsidizer: jest.fn(),
  };

  constructor(address = 'address') {
    this.address = address;
  }
}

export class MockMultiSig {
  details = jest.fn();
}

export function createMockMetadataEntry(
  partial: PartialFuncReturn<MetadataEntry> = {
    id: new BigNumber(1),
    type: MetadataType.Local,
    asset: { id: testValues.assetId, ticker: 'TICKER' },
  }
): DeepMocked<MetadataEntry> {
  return createMock<MetadataEntry>(partial);
}

export function createMockSubsidy(
  partial: PartialFuncReturn<Subsidy> = {
    beneficiary: { address: 'beneficiary' },
    subsidizer: { address: 'subsidizer' },
  }
): DeepMocked<Subsidy> {
  return createMock<Subsidy>(partial);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockResultSet<T extends any[]>(data: T): ResultSet<T> {
  return {
    data,
    next: '0',
    count: new BigNumber(data.length),
  };
}

export function createMockTxResult(
  transactionTag: TxTag
): TransactionResult<void> | ServiceReturn<void> | NotificationPayload<EventType> {
  const transaction = {
    blockHash: '0x1',
    transactionHash: '0x2',
    blockNumber: new BigNumber(1),
    type: TransactionType.Single,
    transactionTag,
  };

  const testTxResult = createMockTransactionResult<void>({
    ...txResult,
    transactions: [transaction],
  });

  return testTxResult;
}
