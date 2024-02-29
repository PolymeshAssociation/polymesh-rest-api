/* istanbul ignore file */

import { IsConfidentialAssetId } from '~/common/decorators/validation';

export class ConfidentialAssetIdParamsDto {
  @IsConfidentialAssetId()
  readonly confidentialAssetId: string;
}
