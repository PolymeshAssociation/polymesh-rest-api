/* istanbul ignore file */
export class MockAssetService {
  findOne = jest.fn();
  findHolders = jest.fn();
  findDocuments = jest.fn();
  findAllByOwner = jest.fn();
  registerTicker = jest.fn();
  createAsset = jest.fn();
  issue = jest.fn();
}

export class MockComplianceService {
  setRequirements = jest.fn();
  findComplianceRequirements = jest.fn();
  findTrustedClaimIssuers = jest.fn();
}

export class MockRelayerAccountsService {
  public findAddressByDid = jest.fn();

  public findAll = jest.fn().mockReturnValue([]);
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
