import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddLocalSignerDto {
  @ApiProperty({
    description: 'The value used to reference the key when signing',
    example: 'alice',
  })
  @IsString()
  @IsNotEmpty()
  handle: string;

  @ApiProperty({
    description: 'The 12 word mnemonic for the signer',
    example: 'clap reveal pledge miss useful motion pair goat book snow scrub bag',
  })
  @IsString()
  @IsNotEmpty()
  mnemonic: string;
}
