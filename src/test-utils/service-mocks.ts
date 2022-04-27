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
  redeem = jest.fn();
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
  reject = jest.fn();
}

export class MockAccountsService {
  getAccountBalance = jest.fn();
  transferPolyx = jest.fn();
  getTransactionHistory = jest.fn();
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
