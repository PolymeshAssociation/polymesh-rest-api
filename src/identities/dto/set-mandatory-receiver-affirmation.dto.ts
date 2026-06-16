/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ReceiverAffirmationRequirement } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class SetMandatoryReceiverAffirmationDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Whether receiver affirmation is required for incoming settlement transfers. Automatic affirms by default on chain v8',
    enum: ReceiverAffirmationRequirement,
    example: ReceiverAffirmationRequirement.Required,
  })
  @IsEnum(ReceiverAffirmationRequirement)
  readonly requirement: ReceiverAffirmationRequirement;
}
