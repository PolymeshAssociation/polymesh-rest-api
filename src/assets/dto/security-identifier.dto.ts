import { ApiProperty } from '@nestjs/swagger';
import { SecurityIdentifierType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

export class SecurityIdentifierDto {
  @ApiProperty({
    description: 'The type of Asset identifier',
    enum: SecurityIdentifierType,
    example: SecurityIdentifierType.Isin,
  })
  @IsEnum(SecurityIdentifierType)
  readonly type: SecurityIdentifierType;

  @ApiProperty({
    description: 'The identifier',
    example: 'US0846707026',
  })
  @IsString()
  readonly value: string;
}
