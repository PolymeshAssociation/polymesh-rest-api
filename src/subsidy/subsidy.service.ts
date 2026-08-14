import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AllowanceOperation,
  Subsidy,
  SubsidyWithAllowance,
} from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { AppValidationError } from '~/common/errors';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AcceptSubsidyDto } from '~/subsidy/dto/accept-subsidy.dto';
import { CreateSubsidyDto } from '~/subsidy/dto/create-subsidy.dto';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { RevokeSubsidyDto } from '~/subsidy/dto/revoke-subsidy.dto';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class SubsidyService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService
  ) {}

  public async getSubsidy(address: string): Promise<SubsidyWithAllowance | null> {
    const account = await this.accountsService.findOne(address);

    return account.subsidies.getSubsidizer();
  }

  public findOne(beneficiary: string, subsidizer: string): Subsidy {
    return this.polymeshService.polymeshApi.accountManagement.getSubsidy({
      beneficiary,
      subsidizer,
    });
  }

  public async approveSubsidy(params: CreateSubsidyDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { approveSubsidy } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(approveSubsidy, args, options);
  }

  public async acceptSubsidy(params: AcceptSubsidyDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { acceptSubsidy } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(acceptSubsidy, args, options);
  }

  public async revokeSubsidy(params: RevokeSubsidyDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { revokeSubsidy } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(revokeSubsidy, args, options);
  }

  public async getPendingSubsidies(address: string): Promise<SubsidyWithAllowance[]> {
    const account = await this.accountsService.findOne(address);

    return account.subsidies.getPendingSubsidies();
  }

  public async quit(params: QuitSubsidyDto): ServiceReturn<void> {
    const {
      options,
      args: { beneficiary, subsidizer },
    } = extractTxOptions(params);

    const { signer } = options;
    const address = await this.transactionsService.getSigningAccount(signer);

    let subsidy: Subsidy;
    if (beneficiary && subsidizer) {
      throw new AppValidationError('Only beneficiary or subsidizer should be provided');
    } else if (beneficiary) {
      subsidy = this.findOne(beneficiary, address);
    } else if (subsidizer) {
      subsidy = this.findOne(address, subsidizer);
    } else {
      throw new AppValidationError('Either beneficiary or subsidizer should be provided');
    }

    return this.transactionsService.submit(subsidy.quit, {}, options);
  }

  public async modifyAllowance(
    params: ModifyAllowanceDto,
    operation: AllowanceOperation
  ): ServiceReturn<void> {
    const {
      options,
      args: { beneficiary, allowance },
    } = extractTxOptions(params);

    const { signer } = options;

    const address = await this.transactionsService.getSigningAccount(signer);

    const subsidy = this.findOne(beneficiary, address);

    const procedureMap = {
      [AllowanceOperation.Set]: subsidy.setAllowance,
      [AllowanceOperation.Increase]: subsidy.increaseAllowance,
      [AllowanceOperation.Decrease]: subsidy.decreaseAllowance,
    };

    return this.transactionsService.submit(procedureMap[operation], { allowance }, options);
  }

  public async getAllowance(beneficiary: string, subsidizer: string): Promise<BigNumber> {
    const subsidy = this.findOne(beneficiary, subsidizer);

    return await subsidy.getAllowance().catch(error => {
      throw handleSdkError(error);
    });
  }
}
