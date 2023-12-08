/* istanbul ignore file */

import { Injectable, PipeTransform } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { GetCustomClaimTypeDto } from '~/claims/dto/get-custom-claim-type.dto';

@Injectable()
export class GetCustomClaimTypePipe implements PipeTransform {
  transform(value: string): GetCustomClaimTypeDto {
    if (isNumericString(value)) {
      return { identifier: new BigNumber(value) };
    } else {
      return { identifier: value };
    }
  }
}

function isNumericString(value: string): boolean {
  return !isNaN(Number(value));
}
