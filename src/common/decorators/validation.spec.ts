import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { validateSync, ValidationArguments } from 'class-validator';

import { ASSET_ID_LENGTH, MAX_TICKER_LENGTH } from '~/assets/assets.consts';
import {
  IncompatibleWith,
  IsAsset,
  IsBigNumber,
  IsDid,
  IsTicker,
  IsTrustedForClaimType,
  IsTxTag,
  IsTxTagOrModuleName,
  TestIsNotSiblingOfConstraint,
} from '~/common/decorators/validation';
import { DID_LENGTH } from '~/identities/identities.consts';

class DidDto {
  @IsDid()
  did!: string;
}

class TickerDto {
  @IsTicker()
  ticker!: string;
}

class AssetDto {
  @IsAsset()
  asset!: string;
}

class BigNumberDto {
  @IsBigNumber({ min: 1, max: 10 })
  value!: BigNumber;
}

class IncompatibleDto {
  @IncompatibleWith(['bar'])
  foo?: string;

  bar?: string;
}

class TrustedClaimDto {
  @IsTrustedForClaimType()
  type!: unknown;
}

class BigNumberArrayDto {
  @IsBigNumber()
  values!: BigNumber[];
}

class MinOnlyDto {
  @IsBigNumber({ min: 5 })
  value!: BigNumber;
}

class MaxOnlyDto {
  @IsBigNumber({ max: 2 })
  value!: BigNumber;
}

class TxTagDto {
  @IsTxTag()
  tag!: string;
}

class TxTagOrModuleDto {
  @IsTxTagOrModuleName()
  tag!: string;
}

describe('decorators/validation', () => {
  it('validates DID strings', () => {
    const valid = new DidDto();
    valid.did = `0x${'a'.repeat(DID_LENGTH - 2)}`;
    expect(validateSync(valid)).toHaveLength(0);

    const empty = new DidDto();
    empty.did = '';
    expect(validateSync(empty)).not.toHaveLength(0);

    const invalid = new DidDto();
    invalid.did = 'not-a-did';
    expect(validateSync(invalid)).not.toHaveLength(0);
  });

  it('validates tickers', () => {
    const dto = new TickerDto();
    dto.ticker = 'T'.repeat(MAX_TICKER_LENGTH);
    expect(validateSync(dto)).toHaveLength(0);

    dto.ticker = 'lowercase';
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('validates asset ids or tickers', () => {
    const dto = new AssetDto();
    dto.asset = 'TICKER';
    expect(validateSync(dto)).toHaveLength(0);

    dto.asset = `0x${'a'.repeat(ASSET_ID_LENGTH - 2)}`;
    expect(validateSync(dto)).toHaveLength(0);

    dto.asset = 'bad';
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('validates BigNumber ranges', () => {
    const dto = new BigNumberDto();
    dto.value = new BigNumber(5);
    expect(validateSync(dto)).toHaveLength(0);

    dto.value = new BigNumber(0);
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('validates arrays of BigNumbers', () => {
    const dto = new BigNumberArrayDto();
    dto.values = [new BigNumber(1), new BigNumber(2)];
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('builds BigNumber messages with min and max', () => {
    const minDto = new MinOnlyDto();
    minDto.value = new BigNumber(1);
    const [minError] = validateSync(minDto);
    expect(Object.values(minError.constraints || {})[0]).toContain('at least 5');

    const maxDto = new MaxOnlyDto();
    maxDto.value = new BigNumber(5);
    const [maxError] = validateSync(maxDto);
    expect(Object.values(maxError.constraints || {})[0]).toContain('at most 2');
  });

  it('enforces incompatible siblings', () => {
    const dto = new IncompatibleDto();
    dto.foo = 'a';
    dto.bar = 'b';
    const errors = validateSync(dto);
    expect(errors).not.toHaveLength(0);
    expect(Object.values(errors[0].constraints || {})).toEqual([
      'Property cannot be used together with: bar',
    ]);

    dto.bar = undefined;
    expect(validateSync(dto)).toHaveLength(0);

    const onlyBar = new IncompatibleDto();
    onlyBar.bar = 'b';
    expect(validateSync(onlyBar)).toHaveLength(0);
  });

  it('validates trusted claim types', () => {
    const dto = new TrustedClaimDto();

    dto.type = null;
    expect(validateSync(dto)).toHaveLength(0);

    dto.type = ClaimType.Accredited;
    expect(validateSync(dto)).toHaveLength(0);

    dto.type = { type: ClaimType.Custom, customClaimTypeId: new BigNumber(1) };
    expect(validateSync(dto)).toHaveLength(0);

    dto.type = { type: ClaimType.Custom, customClaimTypeId: '1' };
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('uses tx tag validators messages', () => {
    const tagDto = new TxTagDto();
    tagDto.tag = 'INVALID';
    const [error] = validateSync(tagDto);
    expect(Object.values(error.constraints || {})[0]).toContain('must be a valid enum value');
  });

  it('uses tx tag or module validators messages', () => {
    const dto = new TxTagOrModuleDto();
    dto.tag = 'INVALID';
    const [error] = validateSync(dto);
    expect(Object.values(error.constraints || {})[0]).toContain(
      'must be a valid enum value from "ModuleName" or "TxTags"'
    );
  });

  it('exposes default message for sibling constraint', () => {
    const constraint = new TestIsNotSiblingOfConstraint();
    const args: ValidationArguments = {
      property: 'foo',
      constraints: ['bar', 'baz'],
      object: { bar: 1, baz: null },
      targetName: 'target',
      value: undefined,
    };
    const message = constraint.defaultMessage(args);
    expect(message).toContain('foo');
    expect(message).toContain('bar');
  });

  it('returns true when sibling value is undefined', () => {
    const constraint = new TestIsNotSiblingOfConstraint();
    const args: ValidationArguments = {
      constraints: ['bar'],
      object: { bar: 'value' },
      property: 'foo',
      targetName: 'target',
      value: undefined,
    };
    const result = constraint.validate(undefined, args);
    expect(result).toBe(true);
  });
});
