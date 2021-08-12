/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { PortfoliosController } from '~/portfolios/portfolios.controller';
import { PortfoliosService } from '~/portfolios/portfolios.service';

jest.mock('@polymathnetwork/polymesh-sdk/types', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/types'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('PortfoliosController', () => {
  let controller: PortfoliosController;
  const mockPortfoliosService = {
    moveAssets: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [PortfoliosService],
    })
      .overrideProvider(PortfoliosService)
      .useValue(mockPortfoliosService)
      .compile();

    controller = module.get<PortfoliosController>(PortfoliosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('moveAssets', () => {
    it('should return the transaction details', async () => {
      const response = { transactions: ['transaction'] };
      mockPortfoliosService.moveAssets.mockResolvedValue(response);
      const params = {
        signer: '0x6000',
        to: new BigNumber('2'),
        items: [{ to: '3', ticker: 'NOK', amount: new BigNumber('100') }],
      };

      const result = await controller.moveAssets({ did: '0x6000' }, params);

      expect(result).toEqual({ transactions: ['transaction'] });
    });
  });
});
