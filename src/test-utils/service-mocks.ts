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
}

export class MockComplianceService {
  setRequirements = jest.fn();
  findComplianceRequirements = jest.fn();
  findTrustedClaimIssuers = jest.fn();
}

export class MockSigningService {
  public getAddressByHandle = jest.fn();
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
