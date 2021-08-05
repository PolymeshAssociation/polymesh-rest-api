import { ApiProperty } from '@nestjs/swagger';
import { TokenIdentifierType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

export class AssetIdentifierDto {
  @ApiProperty({
    description: 'The type of asset identifier',
    enum: TokenIdentifierType,
    example: TokenIdentifierType.Isin,
  })
  @IsEnum(TokenIdentifierType)
  readonly type: string;

  @ApiProperty({
    description: 'The identifier',
    example: 'US0846707026',
  })
  @IsString()
  readonly value: string;
}
