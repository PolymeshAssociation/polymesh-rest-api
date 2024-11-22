/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { TxGroup } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, ValidateNested } from 'class-validator';

import { IncompatibleWith } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';

export class CreatePermissionGroupDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description:
      'Transactions that the `external agent` has permission to execute. This value should not be passed along with the `transactionGroups`.',
    type: TransactionPermissionsDto,
    nullable: true,
  })
  @ValidateNested()
  @IncompatibleWith(['transactionGroups'], {
    message: 'Cannot specify both transactions and transactionGroups',
  })
  @Type(() => TransactionPermissionsDto)
  readonly transactions?: TransactionPermissionsDto;

  @ApiPropertyOptional({
    description:
      'Transaction Groups that `external agent` has permission to execute. This value should not be passed along with the `transactions`.',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.Distribution],
  })
  @IncompatibleWith(['transactions'], {
    message: 'Cannot specify both transactions and transactionGroups',
  })
  @IsArray()
  @IsEnum(TxGroup, { each: true })
  readonly transactionGroups?: TxGroup[];
}
