/* istanbul ignore file */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { MortalityDto } from '~/common/dto/mortality-dto';
import { ProcessMode } from '~/common/types';

export class TransactionOptionsDto {
  @ApiProperty({
    description: 'An identifier or address for the account that should sign the transaction',
    example: 'alice',
  })
  @IsString()
  readonly signer: string;

  @ApiProperty({
    description: 'Mode for processing the transaction',
    enum: ProcessMode,
    example: ProcessMode.AMQP,
  })
  @IsEnum(ProcessMode)
  readonly processMode: ProcessMode;

  // Hide the property so the interactive examples work without additional setup
  @ApiHideProperty()
  @Type(() => MortalityDto)
  @IsOptional()
  @ValidateNested()
  readonly mortality?: MortalityDto;

  @ApiHideProperty()
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly nonce?: BigNumber;

  // Note: If submitWithCallback is used, the user must provide a webhookUrl
  @ApiHideProperty()
  @ValidateIf(({ processMode }) => processMode === ProcessMode.SubmitWithCallback)
  @IsString()
  @IsUrl()
  readonly webhookUrl?: string;

  @ApiHideProperty()
  @ValidateIf(({ processMode }) => processMode === ProcessMode.Offline)
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, string>;
}
