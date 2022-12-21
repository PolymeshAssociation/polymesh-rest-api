import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

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
      'The value of the `signer` to fetch the address for. Note, the format depends on the signing manager the API is configured with. Fireblocks signer uses three numbers `x-y-z`, Vault will be `{name}-{version}, while Local can take on any string, like `alice`',
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
}
