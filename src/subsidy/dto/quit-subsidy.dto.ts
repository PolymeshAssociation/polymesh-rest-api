/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class QuitSubsidyDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Beneficiary address of the Subsidy relationship to be quit. Note, this should be passed only if quitting as a subsidizer',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ValidateIf(({ beneficiary, subsidizer }: QuitSubsidyDto) => !subsidizer || !!beneficiary)
  @IsString()
  readonly beneficiary?: string;

  @ApiProperty({
    description:
      'Subsidizer address of the Subsidy relationship to be quit. Note, this should be passed only if quitting as a beneficiary',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ValidateIf(({ beneficiary, subsidizer }: QuitSubsidyDto) => !beneficiary || !!subsidizer)
  @IsString()
  readonly subsidizer?: string;
}
