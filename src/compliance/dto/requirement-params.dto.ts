/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class RequirementParamsDto extends AssetParamsDto {
  @ApiProperty({
    description: 'Requirement ID',
    type: 'string',
    example: '1',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly id: BigNumber;
}
