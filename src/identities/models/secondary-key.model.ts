/* istanbul ignore file */

import { SignerModel } from '~/identities/models/signer.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';

export class ExtrinsicModel {
  palletName: string;
  dispatchableNames: string[];
}

export class PermissionsModel {
  asset: string[] | null;
  extrinsic: ExtrinsicModel[] | null;
  portfolio: PortfolioModel[] | null;
}

export class SecondaryKeyModel {
  signer: SignerModel;
  permissions?: PermissionsModel;
}
