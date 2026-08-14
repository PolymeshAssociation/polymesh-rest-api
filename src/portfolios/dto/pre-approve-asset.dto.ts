/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsAsset } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class PreApproveAssetDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The Asset (Ticker/Asset ID) to pre-approve',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @IsAsset()
  readonly asset: string;
}
