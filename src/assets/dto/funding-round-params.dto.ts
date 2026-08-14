/* istanbul ignore file */

import { IsString } from 'class-validator';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';

export class FundingRoundParamsDto extends AssetParamsDto {
  @IsString()
  readonly round: string;
}
