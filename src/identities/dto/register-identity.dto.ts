/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

import { PermissionedAccountDto } from '~/accounts/dto/permissioned-account.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RegisterIdentityDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address for which to create an Identity',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  @IsString()
  readonly targetAccount: string;

  @ApiPropertyOptional({
    description: 'Secondary Accounts and their permissions to be added to the Identity',
    type: PermissionedAccountDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PermissionedAccountDto)
  secondaryAccounts?: PermissionedAccountDto[];

  @ApiPropertyOptional({
    description:
      'Issue a CDD claim for the created DID, completing the onboarding process for the Account',
    type: 'boolean',
    example: false,
  })
  readonly createCdd?: boolean;

  @ApiPropertyOptional({
    description: 'Date at which the Identity will expire (to be used together with createCdd)',
    example: new Date(new Date().getTime() + +365 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
