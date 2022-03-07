import { IsString } from 'class-validator';
export class AccountParamsDto {
  @IsString()
  readonly account: string;
}
