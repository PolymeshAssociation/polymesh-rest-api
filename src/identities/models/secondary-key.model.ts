/* istanbul ignore file */

import { SignerModel } from '~/identities/models/signer.model';

export class SecondaryKeyModel {
  signer: SignerModel;
  permissions?: any;
}
