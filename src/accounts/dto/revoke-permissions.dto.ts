/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RevokePermissionsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'List of secondary Account addresses whose permissions are to be revoked',
    type: 'string',
    isArray: true,
    example: ['5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV'],
  })
  @IsString({ each: true })
  readonly secondaryAccounts: string[];
}
