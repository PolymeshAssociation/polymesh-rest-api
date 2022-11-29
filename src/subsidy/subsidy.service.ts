import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AllowanceOperation,
  AuthorizationRequest,
  ErrorCode,
  Subsidy,
  SubsidyWithAllowance,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AccountsService } from '~/accounts/accounts.service';
import { ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { CreateSubsidyDto } from '~/subsidy/dto/create-subsidy.dto';
import { ModifyAllowanceDto } from '~/subsidy/dto/modify-allowance.dto';
import { QuitSubsidyDto } from '~/subsidy/dto/quit-subsidy.dto';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class SubsidyService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService
  ) {}

  public async getSubsidy(address: string): Promise<SubsidyWithAllowance | null> {
    const account = await this.accountsService.findOne(address);
    return account.getSubsidy();
  }

  public findOne(beneficiary: string, subsidizer: string): Subsidy {
    return this.polymeshService.polymeshApi.accountManagement.getSubsidy({
      beneficiary,
      subsidizer,
    });
  }

  public async subsidizeAccount(params: CreateSubsidyDto): ServiceReturn<AuthorizationRequest> {
    const { signer, webhookUrl, beneficiary, allowance } = params;

    const { subsidizeAccount } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(
      subsidizeAccount,
      { beneficiary, allowance },
      { signer, webhookUrl }
    );
  }

  public async quit(params: QuitSubsidyDto): ServiceReturn<void> {
    const { signer, webhookUrl, beneficiary, subsidizer } = params;

    const address = await this.transactionsService.getSigningAccount(signer);

    let subsidy: Subsidy;
    if (beneficiary) {
      subsidy = this.findOne(beneficiary, address);
    } else if (subsidizer) {
      subsidy = this.findOne(address, subsidizer);
    } else {
      throw new BadRequestException('Beneficiary or subsidizer should be specified');
    }

    return this.transactionsService.submit(subsidy.quit, {}, { signer, webhookUrl });
  }

  public async modifyAllowance(params: ModifyAllowanceDto): ServiceReturn<void> {
    const { signer, webhookUrl, beneficiary, allowance, operation } = params;

    const address = await this.transactionsService.getSigningAccount(signer);

    const subsidy = this.findOne(beneficiary, address);

    const procedureMap = {
      [AllowanceOperation.Set]: subsidy.setAllowance,
      [AllowanceOperation.Increase]: subsidy.increaseAllowance,
      [AllowanceOperation.Decrease]: subsidy.decreaseAllowance,
    };

    return this.transactionsService.submit(
      procedureMap[operation],
      { allowance },
      { signer, webhookUrl }
    );
  }

  public async getAllowance(beneficiary: string, subsidizer: string): Promise<BigNumber> {
    const subsidy = this.findOne(beneficiary, subsidizer);

    try {
      return await subsidy.getAllowance();
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          throw new NotFoundException('The Subsidy no longer exists');
        }
      }

      throw err;
    }
  }
}
