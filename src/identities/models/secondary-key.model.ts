/* istanbul ignore file */

import { PortfolioModel } from '~/common/models/portfolio.model';
import { SignerModel } from '~/identities/models/signer.model';

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
