/* istanbul ignore file */

import { createMock } from '@golevelup/ts-jest';
import { ValueProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '~/auth/auth.service';
import { ClaimsService } from '~/claims/claims.service';
import { ComplianceRequirementsService } from '~/compliance/compliance-requirements.service';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { MetadataService } from '~/metadata/metadata.service';
import { NetworkService } from '~/network/network.service';
import { SubsidyService } from '~/subsidy/subsidy.service';
import { ServiceProvider } from '~/test-utils/types';
import { TransactionsService } from '~/transactions/transactions.service';
import { UsersService } from '~/users/users.service';

export class MockAssetService {
  findOne = jest.fn();
  findHolders = jest.fn();
  findDocuments = jest.fn();
  setDocuments = jest.fn();
  findAllByOwner = jest.fn();
  registerTicker = jest.fn();
  createAsset = jest.fn();
  issue = jest.fn();
  transferOwnership = jest.fn();
  redeem = jest.fn();
  freeze = jest.fn();
  unfreeze = jest.fn();
  controllerTransfer = jest.fn();
  getOperationHistory = jest.fn();
}

export class MockTransactionsService {
  submit = jest.fn();
  getSigningAccount = jest.fn();
}

export const mockTransactionsProvider = {
  provide: TransactionsService,
  useValue: new MockTransactionsService(),
};

export class MockComplianceRequirementsService {
  setRequirements = jest.fn();
  findComplianceRequirements = jest.fn();
  pauseRequirements = jest.fn();
  unpauseRequirements = jest.fn();
  deleteAll = jest.fn();
  deleteOne = jest.fn();
  add = jest.fn();
  modify = jest.fn();
}

export const mockComplianceRequirementsServiceProvider: ValueProvider<ComplianceRequirementsService> =
  {
    provide: ComplianceRequirementsService,
    useValue: createMock<ComplianceRequirementsService>(),
  };

export const mockDeveloperServiceProvider: ValueProvider<DeveloperTestingService> = {
  provide: DeveloperTestingService,
  useValue: createMock<DeveloperTestingService>(),
};

export class MockSigningService {
  public getAddressByHandle = jest.fn();
}

export class MockTickerReservationsService {
  findOne = jest.fn();
  reserve = jest.fn();
  transferOwnership = jest.fn();
  extend = jest.fn();
  findAllByOwner = jest.fn();
}

export class MockAuthorizationsService {
  findPendingByDid = jest.fn();
  findIssuedByDid = jest.fn();
  findOneByDid = jest.fn();
  accept = jest.fn();
  remove = jest.fn();
}

export class MockAccountsService {
  getAccountBalance = jest.fn();
  transferPolyx = jest.fn();
  getTransactionHistory = jest.fn();
  getPermissions = jest.fn();
  findOne = jest.fn();
  freezeSecondaryAccounts = jest.fn();
  unfreezeSecondaryAccounts = jest.fn();
  modifyPermissions = jest.fn();
  revokePermissions = jest.fn();
  getTreasuryAccount = jest.fn();
}

export class MockEventsService {
  createEvent = jest.fn();
  findOne = jest.fn();
}

export class MockSubscriptionsService {
  findAll = jest.fn();
  findOne = jest.fn();
  createSubscription = jest.fn();
  updateSubscription = jest.fn();
  batchMarkAsDone = jest.fn();
  batchBumpNonce = jest.fn();
}

export class MockNotificationsService {
  findOne = jest.fn();
  createNotifications = jest.fn();
  updateNotification = jest.fn();
}

export class MockHttpService {
  post = jest.fn();
}

export class MockScheduleService {
  addTimeout = jest.fn();
  addInterval = jest.fn();
}

export class MockIdentitiesService {
  findOne = jest.fn();
  findTrustingAssets = jest.fn();
  addSecondaryAccount = jest.fn();
  createMockCdd = jest.fn();
}

export class MockSettlementsService {
  findInstruction = jest.fn();
  createInstruction = jest.fn();
  affirmInstruction = jest.fn();
  rejectInstruction = jest.fn();
  findVenueDetails = jest.fn();
  findAffirmations = jest.fn();
  createVenue = jest.fn();
  modifyVenue = jest.fn();
  canTransfer = jest.fn();
  findPendingInstructionsByDid = jest.fn();
  findVenuesByOwner = jest.fn();
  rescheduleInstruction = jest.fn();
}

export class MockPortfoliosService {
  moveAssets = jest.fn();
  findAllByOwner = jest.fn();
  createPortfolio = jest.fn();
  deletePortfolio = jest.fn();
  getCustodiedPortfolios = jest.fn();
  findOne = jest.fn();
  createdAt = jest.fn();
  setCustodian = jest.fn();
}

export class MockOfferingsService {
  findInvestmentsByTicker = jest.fn();
  findAllByTicker = jest.fn();
}

export class MockCorporateActionsService {
  findDefaultConfigByTicker = jest.fn();
  updateDefaultConfigByTicker = jest.fn();
  findDistributionsByTicker = jest.fn();
  findDistribution = jest.fn();
  createDividendDistribution = jest.fn();
  remove = jest.fn();
  payDividends = jest.fn();
  claimDividends = jest.fn();
  linkDocuments = jest.fn();
  reclaimRemainingFunds = jest.fn();
  modifyCheckpoint = jest.fn();
}

export class MockCheckpointsService {
  findAllByTicker = jest.fn();
  findSchedulesByTicker = jest.fn();
  findScheduleById = jest.fn();
  createByTicker = jest.fn();
  createScheduleByTicker = jest.fn();
  getAssetBalance = jest.fn();
  getHolders = jest.fn();
  deleteScheduleByTicker = jest.fn();
  findOne = jest.fn();
}

export class MockAuthService {
  createApiKey = jest.fn();
  deleteApiKey = jest.fn();
  validateApiKey = jest.fn();
}

export class MockTrustedClaimIssuersService {
  find = jest.fn();
  set = jest.fn();
  add = jest.fn();
  remove = jest.fn();
}

export const mockAuthServiceProvider = {
  provide: AuthService,
  useValue: new MockAuthService(),
};

export const mockUserServiceProvider: ValueProvider<UsersService> = {
  provide: UsersService,
  useValue: createMock<UsersService>(),
};

export const mockTrustedClaimIssuersServiceProvider: ValueProvider<TrustedClaimIssuersService> = {
  provide: TrustedClaimIssuersService,
  useValue: createMock<TrustedClaimIssuersService>(),
};

export const mockMetadataServiceProvider: ValueProvider<MetadataService> = {
  provide: MetadataService,
  useValue: createMock<MetadataService>(),
};

export const mockSubsidyServiceProvider: ValueProvider<SubsidyService> = {
  provide: SubsidyService,
  useValue: createMock<SubsidyService>(),
};

/**
 * Given a set of key values to use as config, will wrap and return as a Nest "provider" for config
 */
export const makeMockConfigProvider = (config: Record<string, unknown>): ServiceProvider => {
  return {
    useValue: {
      get: (key: string): unknown => config[key],
      getOrThrow: (key: string): unknown => {
        const value = config[key];
        if (value) {
          return value;
        } else {
          throw new Error(`mock config error: "${key}" was not found`);
        }
      },
    },
    provide: ConfigService,
  };
};

export const mockNetworkServiceProvider: ValueProvider<NetworkService> = {
  provide: NetworkService,
  useValue: createMock<NetworkService>(),
};

export const mockClaimsServiceProvider: ValueProvider<ClaimsService> = {
  provide: ClaimsService,
  useValue: createMock<ClaimsService>(),
};
