/* istanbul ignore file */

import { IsAsset } from '~/common/decorators/validation';

export class AssetParamsDto {
  @IsAsset()
  readonly asset: string;
}
