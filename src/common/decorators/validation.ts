/* istanbul ignore file */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { applyDecorators } from '@nestjs/common';
import { IsHexadecimal, IsUppercase, Length, Matches, MaxLength } from 'class-validator';

import { DID_LENGTH } from '~/identities/identities.consts';
import { MAX_TICKER_LENGTH } from '~/tokens/tokens.consts';

export function IsDid() {
  return applyDecorators(
    IsHexadecimal({
      message: 'DID must be a hexadecimal number',
    }),
    Matches(/^0x.+/, {
      message: 'DID must start with "0x"',
    }),
    Length(DID_LENGTH, undefined, {
      message: `DID must be ${DID_LENGTH} characters long`,
    })
  );
}

export function IsTicker() {
  return applyDecorators(MaxLength(MAX_TICKER_LENGTH), IsUppercase());
}
