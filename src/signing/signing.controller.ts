import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AddLocalSignerDto } from '~/signing/dto/add-local-signer.dto';
import { SignerDetailsDto } from '~/signing/dto/signer-details.dto';
import { SignerModel } from '~/signing/models/signer.model';
import { SigningService } from '~/signing/services';

@ApiTags('signer')
@Controller('signer')
export class SigningController {
  constructor(private readonly signingService: SigningService) {}

  @ApiOperation({
    summary: 'Fetch signer details',
    description: 'This endpoint provides information associated with a particular `signer`',
  })
  @ApiParam({
    name: 'signer',
    description:
      'The value of the `signer` to fetch the address for. Note, the format depends on the signing manager the API is configured with. A Fireblocks signer is up to three numbers like `x-y-z`, Vault will be `{name}-{version}`, while a Local signer can be any string, like `alice`',
    type: 'string',
    example: 'alice',
  })
  @ApiNotFoundResponse({
    description: 'The signer was not found',
  })
  @ApiBadRequestResponse({
    description: 'The signer did not have the proper format for the given signing manager',
  })
  @ApiOkResponse({
    description: 'Information about the address associated to the signer',
    type: SignerModel,
  })
  @Get('/:signer')
  public async getSignerAddress(@Param() { signer }: SignerDetailsDto): Promise<SignerModel> {
    const address = await this.signingService.getAddressByHandle(signer);

    return new SignerModel({ address });
  }

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
