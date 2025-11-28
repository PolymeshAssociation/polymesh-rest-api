import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  PortfolioBalance,
} from '@polymeshassociation/polymesh-sdk/types';
import { isNumberedPortfolio } from '@polymeshassociation/polymesh-sdk/utils';

import {
  createPortfolioIdentifierModel,
  createPortfolioModel,
  toPortfolioId,
} from '~/portfolios/portfolios.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  isNumberedPortfolio: jest.fn(),
}));

const mockIsNumberedPortfolio = isNumberedPortfolio as unknown as jest.MockedFunction<
  typeof isNumberedPortfolio
>;

describe('portfolios.util', () => {
  beforeEach(() => {
    mockIsNumberedPortfolio.mockReset();
  });

  it('creates portfolio model for default portfolios', async () => {
    mockIsNumberedPortfolio.mockReturnValue(false);
    const portfolio: DeepMocked<DefaultPortfolio> = createMock<DefaultPortfolio>({
      owner: { did: 'owner' } as Identity,
      getAssetBalances: jest.fn().mockResolvedValue([] as PortfolioBalance[]),
      getCustodian: jest.fn().mockResolvedValue({ did: 'custodian' }),
    });

    const model = await createPortfolioModel(portfolio, 'owner');
    expect(model).toMatchObject({ owner: { did: 'owner' }, name: 'default' });
  });

  it('creates portfolio model for numbered portfolios', async () => {
    mockIsNumberedPortfolio.mockReturnValue(true);
    const portfolio: DeepMocked<NumberedPortfolio> = createMock<NumberedPortfolio>({
      id: new BigNumber(1),
      owner: { did: 'owner' } as Identity,
      getAssetBalances: jest
        .fn()
        .mockResolvedValue([{ asset: 'TICKER', total: 1, free: 1, locked: 0 }]),
      getCustodian: jest.fn().mockResolvedValue({ did: 'custodian' }),
      getName: jest.fn().mockResolvedValue('Growth'),
    });

    const model = await createPortfolioModel(portfolio, 'other');
    expect(model).toMatchObject({ id: portfolio.id, name: 'Growth' });
    expect(model.custodian).toMatchObject({ did: 'custodian' });
  });

  it('creates identifier models and converts ids', () => {
    const identifier = createPortfolioIdentifierModel({
      toHuman: () => ({ id: 1 }),
    } as unknown as DefaultPortfolio);
    expect(identifier).toBeInstanceOf(Object);

    expect(toPortfolioId(new BigNumber(0))).toBeUndefined();
    expect(toPortfolioId(new BigNumber(1))?.eq(1)).toBe(true);
  });
});
