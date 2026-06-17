import { Account } from '@polymeshassociation/polymesh-sdk/internal';
import { DefaultPortfolio, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { AssetHolderType } from '~/common/dto/asset-holder.dto';
import {
  createAssetHolderModel,
  createInstructionPartyModel,
} from '~/common/models/asset-holder.model';
import { testValues } from '~/test-utils/consts';
import { MockPortfolio } from '~/test-utils/mocks';

const { did } = testValues;

function createTestAccount(address: string): Account {
  const account = Object.create(Account.prototype) as Account;
  account.address = address;
  return account;
}

describe('asset-holder.model', () => {
  describe('createAssetHolderModel', () => {
    it('should map an Account to an account holder model', () => {
      const address = '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM';
      const account = createTestAccount(address);

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

      const result = createAssetHolderModel(portfolio as unknown as DefaultPortfolio);

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
      const account = createTestAccount(address);

      const result = createInstructionPartyModel(account);

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
