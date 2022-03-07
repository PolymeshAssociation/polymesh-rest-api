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

export class MockAccountsService {
  getAccountBalance = jest.fn();
}
