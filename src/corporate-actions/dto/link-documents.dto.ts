/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { SignerDto } from '~/common/dto/signer.dto';

export class LinkDocumentsDto extends SignerDto {
  @ApiProperty({
    description: 'List of documents to be linked to the Corporate Action',
    type: AssetDocumentDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AssetDocumentDto)
  readonly documents: AssetDocumentDto[];
}
