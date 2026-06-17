import {
  Account,
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
} from '@polymeshassociation/polymesh-sdk/types';
import {
  isAccount,
  isDefaultPortfolio,
  isIdentity,
  isNumberedPortfolio,
} from '@polymeshassociation/polymesh-sdk/utils';

import { AssetHolderType } from '~/common/dto/asset-holder.dto';
import {
  createAssetHolderModel,
  createInstructionPartyModel,
} from '~/common/models/asset-holder.model';
import { testValues } from '~/test-utils/consts';
import { MockPortfolio } from '~/test-utils/mocks';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  isAccount: jest.fn(),
  isIdentity: jest.fn(),
  isDefaultPortfolio: jest.fn(),
  isNumberedPortfolio: jest.fn(),
}));

const { did } = testValues;

const mockIsAccount = isAccount as unknown as jest.MockedFunction<typeof isAccount>;
const mockIsIdentity = isIdentity as unknown as jest.MockedFunction<typeof isIdentity>;
const mockIsDefaultPortfolio = isDefaultPortfolio as unknown as jest.MockedFunction<
  typeof isDefaultPortfolio
>;
const mockIsNumberedPortfolio = isNumberedPortfolio as unknown as jest.MockedFunction<
  typeof isNumberedPortfolio
>;

describe('asset-holder.model', () => {
  beforeEach(() => {
    mockIsAccount.mockReturnValue(false);
    mockIsIdentity.mockReturnValue(false);
    mockIsDefaultPortfolio.mockReturnValue(false);
    mockIsNumberedPortfolio.mockReturnValue(false);
  });

  describe('createAssetHolderModel', () => {
    it('should map an Account to an account holder model', () => {
      const address = '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM';
      const account = { address } as Account;

      mockIsAccount.mockReturnValue(true);
      const result = createAssetHolderModel(account);

      expect(result).toEqual(
        expect.objectContaining({
          type: AssetHolderType.account,
          address,
        })
      );
    });

    it('should map a portfolio to a portfolio holder model', () => {
      const portfolio = new MockPortfolio();

      mockIsDefaultPortfolio.mockReturnValue(true);
      let result = createAssetHolderModel(portfolio as unknown as DefaultPortfolio);

      expect(result).toEqual(
        expect.objectContaining({
          type: AssetHolderType.portfolio,
          portfolio: expect.objectContaining({ did }),
        })
      );

      mockIsDefaultPortfolio.mockReturnValue(false);
      mockIsNumberedPortfolio.mockReturnValue(true);
      result = createAssetHolderModel(portfolio as unknown as NumberedPortfolio);

      expect(result).toEqual(
        expect.objectContaining({
          type: AssetHolderType.portfolio,
          portfolio: expect.objectContaining({ did }),
        })
      );
    });
  });

  describe('createInstructionPartyModel', () => {
    it('should map an Account party to an asset holder model', () => {
      const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

      mockIsAccount.mockReturnValue(true);
      const result = createInstructionPartyModel({ address } as Account);

      expect(result.party).toEqual(
        expect.objectContaining({
          type: AssetHolderType.account,
          address,
        })
      );
      expect(result.identity).toBeUndefined();
    });

    it('should map an Identity party to a DID model', () => {
      const identity = { did } as Identity;

      mockIsIdentity.mockReturnValue(true);
      const result = createInstructionPartyModel(identity);

      expect(result).toEqual({
        party: { did },
        identity,
      });
    });

    it('should map a plain object with did to an identity party', () => {
      const party = { did };

      const result = createInstructionPartyModel(party as Identity);

      expect(result).toEqual({
        party: { did },
        identity: party,
      });
    });
  });
});
