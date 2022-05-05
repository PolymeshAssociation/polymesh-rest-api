/* istanbul ignore file */

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
}

export class MockComplianceService {
  setRequirements = jest.fn();
  findComplianceRequirements = jest.fn();
  findTrustedClaimIssuers = jest.fn();
}

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
  findOne = jest.fn();
  accept = jest.fn();
  remove = jest.fn();
}

export class MockAccountsService {
  getAccountBalance = jest.fn();
  transferPolyx = jest.fn();
  getTransactionHistory = jest.fn();
  getPermissions = jest.fn();
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
}

export class MockClaimsService {
  findIssuedByDid = jest.fn();
  findAssociatedByDid = jest.fn();
}

export class MockPortfoliosService {
  moveAssets = jest.fn();
  findAllByOwner = jest.fn();
  createPortfolio = jest.fn();
  deletePortfolio = jest.fn();
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
