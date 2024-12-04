/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';

export class CheckPermissionsResultModel {
  @ApiPropertyOptional({
    description:
      "Required permissions which the signer doesn't have. Only present if result is false",
    type: 'string',
    isArray: true,
    example: [TxTags.asset.Issue],
    nullable: true,
  })
  readonly missingPermissions?: TxTag[] | null;

  @ApiProperty({
    description: 'Whether the signer complies with the required permissions or not',
    type: 'boolean',
    example: true,
  })
  readonly result: boolean;

  @ApiPropertyOptional({
    description: 'Optional message explaining the reason for failure in special cases',
    type: 'string',
    example: 'You are not authorized to perform this action',
  })
  readonly message?: string;

  constructor(model: CheckPermissionsResultModel) {
    Object.assign(this, model);
  }
}
