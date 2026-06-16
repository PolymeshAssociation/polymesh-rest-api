import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AssetHolderDto, AssetHolderType } from '~/common/dto/asset-holder.dto';
import { AppValidationError } from '~/common/errors';
import { testValues } from '~/test-utils/consts';

const { did } = testValues;

describe('AssetHolderDto', () => {
  describe('toAssetHolderLike', () => {
    it('should return an account address for an account holder', () => {
      const address = '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM';
      const holder = new AssetHolderDto({
        type: AssetHolderType.account,
        address,
      });

      expect(holder.toAssetHolderLike()).toBe(address);
    });

    it('should return a DID for a default portfolio holder', () => {
      const holder = new AssetHolderDto({
        type: AssetHolderType.portfolio,
        did,
        id: new BigNumber(0),
      });

      expect(holder.toAssetHolderLike()).toBe(did);
    });

    it('should return a numbered portfolio for a non-default portfolio holder', () => {
      const holder = new AssetHolderDto({
        type: AssetHolderType.portfolio,
        did,
        id: new BigNumber(2),
      });

      expect(holder.toAssetHolderLike()).toEqual({
        identity: did,
        id: new BigNumber(2),
      });
    });

    it('should infer portfolio holder from legacy did and id fields', () => {
      const holder = new AssetHolderDto({
        did,
        id: new BigNumber(1),
      });

      expect(holder.toAssetHolderLike()).toEqual({
        identity: did,
        id: new BigNumber(1),
      });
    });

    it('should throw when neither account nor portfolio fields are provided', () => {
      const holder = new AssetHolderDto({});

      expect(() => holder.toAssetHolderLike()).toThrow(AppValidationError);
    });
  });
});
