import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AddLocalSignerDto } from '~/signing/dto/add-local-signer.dto';
import { SignerModel } from '~/signing/models/signer.model';
import { SigningService } from '~/signing/services';

/**
 * @note only registered when `SIGNER_MANAGEMENT_ENABLED` resolves to true
 */
@ApiTags('signer')
@Controller('signer')
export class SignerManagementController {
  constructor(private readonly signingService: SigningService) {}

  @ApiOperation({
    summary: 'Add a new signer',
    description: 'Adds a new key to the signing manager',
  })
  @ApiCreatedResponse({
    description: 'The signer was successfully added',
    type: SignerModel,
  })
  @ApiBadRequestResponse({
    description: 'Invalid mnemonic or handle provided',
  })
  @Post()
  public async addSigner(@Body() { handle, mnemonic }: AddLocalSignerDto): Promise<SignerModel> {
    const address = await this.signingService.addSigner(handle, mnemonic);

    return new SignerModel({ address });
  }
}
