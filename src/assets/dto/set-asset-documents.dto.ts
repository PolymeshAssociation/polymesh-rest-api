/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class SetAssetDocumentsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'New list of documents to replace the existing ones',
    type: AssetDocumentDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AssetDocumentDto)
  readonly documents: AssetDocumentDto[];
}
