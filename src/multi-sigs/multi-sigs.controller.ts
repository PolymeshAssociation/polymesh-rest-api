import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { MultiSig } from '@polymeshassociation/polymesh-sdk/types';

import { ApiTransactionResponse } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { CreateMultiSigDto } from '~/multi-sigs/dto/create-multi-sig.dto';
import { JoinCreatorDto } from '~/multi-sigs/dto/join-creator.dto';
import { ModifyMultiSigDto } from '~/multi-sigs/dto/modify-multi-sig.dto';
import { MultiSigParamsDto } from '~/multi-sigs/dto/multi-sig-params.dto';
import { MultiSigProposalParamsDto } from '~/multi-sigs/dto/multisig-proposal-params.dto';
import { MultiSigCreatedModel } from '~/multi-sigs/models/multi-sig-created.model';
import { MultiSigProposalModel } from '~/multi-sigs/models/multi-sig-proposal.model';
import { MultiSigsService } from '~/multi-sigs/multi-sigs.service';

@ApiTags('multi-sigs')
@Controller('multi-sigs')
export class MultiSigsController {
  constructor(private readonly multiSigService: MultiSigsService) {}

  @ApiOperation({
    summary: 'Create a MultiSig account',
    description:
      "This endpoint creates a multiSig account. The signer's identity will be the multiSig's creator. The creator is granted admin privileges over the multiSig and their primary key will be charged any POLYX fee on behalf of the multiSig account.",
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: MultiSigCreatedModel,
  })
  @ApiBadRequestResponse({
    description:
      '<ul>' +
      '<li>The number of required signatures should not exceed the number of signers</li>' +
      '<li>An address is not valid a SS58 address</li>' +
      '</ul>',
  })
  @Post('create')
  async create(@Body() params: CreateMultiSigDto): Promise<TransactionResponseModel> {
    const serviceResult = await this.multiSigService.create(params);

    const resolver: TransactionResolver<MultiSig> = async ({ transactions, details, result }) => {
      const { address } = result;

      return new MultiSigCreatedModel({
        multiSigAddress: address,
        details,
        transactions,
      });
    };

    return handleServiceResult(serviceResult, resolver);
  }

  @ApiOperation({
    summary: "Join the creator's identity as a signing key",
    description: `This endpoint joins a MultiSig to its creator's identity. For the multiSig to join a DID not belonging to the creator then a join identity auth needs to be made and accepted by the MultiSig. 
      NOTE: This endpoint is only applicable for 6.x.x chains as from 7.x.x chain, the MultiSig is automatically attached to the creator's identity`,
    deprecated: true,
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: '<ul>' + '<li>The multiSig is already attached to an identity</li>' + '</ul>',
  })
  @Post(':multiSigAddress/join-creator')
  async joinCreator(
    @Param() { multiSigAddress }: MultiSigParamsDto,
    @Body() params: JoinCreatorDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.multiSigService.joinCreator(multiSigAddress, params);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Modify a MultiSig',
    description: 'This endpoint allows for a multiSig to be modified by its creator',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description:
      '<ul>' +
      '<li>The account is not a multiSig account</li>' +
      '<li>requiredSignatures cannot exceed the number of signers</li>' +
      "<li>The signing account must belong to the multiSig creator's identity</li>" +
      '</ul>',
  })
  @Post(':multiSigAddress/modify')
  async modify(
    @Param() { multiSigAddress }: MultiSigParamsDto,
    @Body() params: ModifyMultiSigDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.multiSigService.modify(multiSigAddress, params);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Get proposal details',
    description: 'This endpoint returns details for a multiSig proposal',
  })
  @Get(':multiSigAddress/proposals/:proposalId')
  async getProposal(@Param() params: MultiSigProposalParamsDto): Promise<unknown> {
    const proposal = await this.multiSigService.findProposal(params);

    const details = await proposal.details();

    return new MultiSigProposalModel({
      multiSigAddress: proposal.multiSig.address,
      proposalId: proposal.id,
      details,
    });
  }

  @ApiOperation({
    summary: 'Accept a proposal',
    description: 'This endpoint allows for a MultiSig to accept a proposal',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: 'The account is not a multiSig',
  })
  @ApiNotFoundResponse({
    description: 'The multiSig proposal was not found',
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' + '<li>The signing account has already voted for the multiSig proposal</li>' + '</ul>',
  })
  @Post(':multiSigAddress/proposals/:proposalId/approve')
  async approveProposal(
    @Param() params: MultiSigProposalParamsDto,
    @Body() body: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.multiSigService.approve(params, body);

    return handleServiceResult(serviceResult);
  }

  @ApiOperation({
    summary: 'Reject a proposal',
    description: 'This endpoint allows for a MultiSig signer to reject a proposal',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The multiSig proposal was not found',
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' + '<li>The signing account has already voted for the MultiSig proposal</li>' + '</ul>',
  })
  @Post(':multiSigAddress/proposals/:proposalId/reject')
  async rejectProposal(
    @Param() params: MultiSigProposalParamsDto,
    @Body() body: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.multiSigService.reject(params, body);

    return handleServiceResult(serviceResult);
  }
}
