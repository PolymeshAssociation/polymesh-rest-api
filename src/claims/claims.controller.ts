import { Body, Controller, Get, HttpStatus, NotFoundException, Post, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { ClaimsService } from '~/claims/claims.service';
import { GetCustomClaimTypeDto } from '~/claims/dto/get-custom-claim-type.dto';
import { ModifyClaimsDto } from '~/claims/dto/modify-claims.dto';
import { RegisterCustomClaimTypeDto } from '~/claims/dto/register-custom-claim-type.dto';
import { CustomClaimTypeModel } from '~/claims/models/custom-claim-type.model';
import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

@ApiTags('claims')
@Controller('claims')
export class ClaimsController {
  constructor(
    private readonly claimsService: ClaimsService,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(ClaimsController.name);
  }

  @ApiOperation({
    summary: 'Add Claims targeting an Identity',
    description: 'This endpoint will add Claims to an Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      "A target Identity cannot have CDD claims with different IDs' this should also be added",
    ],
    [HttpStatus.NOT_FOUND]: ['Some of the supplied Identity IDs do not exist'],
  })
  @Post('add')
  async addClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.addClaimsOnDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Edit Claims targeting an Identity',
    description: 'This endpoint allows changing the expiry of a Claim',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
  })
  @Post('edit')
  async editClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.editClaimsOnDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Remove provided Claims from an Identity',
    description: 'This endpoint will remove Claims from an Identity',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: ['Account does not have the required roles or permissions'],
    [HttpStatus.BAD_REQUEST]: [
      'Attempt to revoke Investor Uniqueness claims from investors with positive balance',
    ],
  })
  @Post('remove')
  async revokeClaims(@Body() args: ModifyClaimsDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.revokeClaimsFromDid(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Register a CustomClaimType',
    description: 'This endpoint will add the CustomClaimType to the network',
  })
  @ApiTransactionResponse({
    description: 'Transaction response',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: [
      'Validation: CustomClaimType name length exceeded',
      'Validation: The CustomClaimType with provided name already exists',
    ],
  })
  @Post('custom-claim-type')
  async registerCustomClaimType(
    @Body() args: RegisterCustomClaimTypeDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.claimsService.registerCustomClaimType(args);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Get CustomClaimType',
    description:
      'This endpoint will retrieve the custom claim type by id or name. <br /> `ID` or name needs to be provided. <br/> If both are provided will fetch using `ID`',
  })
  @ApiQuery({
    name: 'id',
    description: 'The id of the CustomClaimType',
    type: 'string',
    required: false,
    example: '1',
  })
  @ApiQuery({
    name: 'name',
    description: 'The name of the CustomClaimType',
    type: 'string',
    required: false,
    example: 'Can Buy Asset',
  })
  @ApiNotFoundResponse({
    description: 'The CustomClaimType does not exist',
  })
  @Get('custom-claim-type')
  async getCustomClaimType(
    @Query() { id, name }: GetCustomClaimTypeDto
  ): Promise<CustomClaimTypeModel> {
    const result = id
      ? await this.claimsService.getCustomClaimTypeById(id)
      : await this.claimsService.getCustomClaimTypeByName(name);

    if (!result) {
      throw new NotFoundException('Custom claim type not found');
    }

    return new CustomClaimTypeModel(result);
  }
}
