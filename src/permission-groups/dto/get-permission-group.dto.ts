/* istanbul ignore file */

import { IntersectionType } from '@nestjs/swagger';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class GetPermissionGroupDto extends IntersectionType(AssetParamsDto, IdParamsDto) {}
