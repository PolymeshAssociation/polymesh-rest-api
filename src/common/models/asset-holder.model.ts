/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Account,
  AssetHolder,
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
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export class AssetHolderModel {
  @ApiProperty({
    description: 'Whether the asset holder is an Account or a Portfolio',
    enum: AssetHolderType,
    example: AssetHolderType.portfolio,
  })
  readonly type: AssetHolderType;

  @ApiPropertyOptional({
    description: 'Account address when the holder is an Account',
    type: 'string',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  readonly address?: string;

  @ApiPropertyOptional({
    description: 'Portfolio details when the holder is a Portfolio',
    type: PortfolioIdentifierModel,
  })
  readonly portfolio?: PortfolioIdentifierModel;

  constructor(model: AssetHolderModel) {
    Object.assign(this, model);
  }
}

export function createAssetHolderModel(holder: AssetHolder | Account): AssetHolderModel {
  if (isAccount(holder)) {
    return new AssetHolderModel({
      type: AssetHolderType.account,
      address: (holder as Account).address,
    });
  }

  if (isDefaultPortfolio(holder) || isNumberedPortfolio(holder)) {
    return new AssetHolderModel({
      type: AssetHolderType.portfolio,
      portfolio: createPortfolioIdentifierModel(holder as DefaultPortfolio | NumberedPortfolio),
    });
  }

  if (typeof (holder as { toHuman?: () => unknown }).toHuman === 'function') {
    return new AssetHolderModel({
      type: AssetHolderType.portfolio,
      portfolio: createPortfolioIdentifierModel(holder as DefaultPortfolio | NumberedPortfolio),
    });
  }

  throw new Error('Unsupported asset holder type');
}

export function createInstructionPartyModel(party: Account | Identity): {
  party: AssetHolderModel | { did: string };
  identity?: Identity;
} {
  if (isAccount(party)) {
    return {
      party: createAssetHolderModel(party),
    };
  }

  if (isIdentity(party)) {
    return {
      party: { did: party.did },
      identity: party,
    };
  }

  if (typeof party === 'object' && party !== null && 'did' in party) {
    return {
      party: { did: (party as Identity).did },
      identity: party as Identity,
    };
  }

  throw new Error('Unsupported instruction party type');
}
