/* istanbul ignore file */

import { IsString } from 'class-validator';

export class SignerDetailsDto {
  @IsString()
  readonly signer: string;
}
