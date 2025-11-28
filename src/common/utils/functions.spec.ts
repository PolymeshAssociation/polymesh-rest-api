import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Leg,
  MultiSigProposal,
  PayingAccountType,
  TransactionPayload,
  TransactionStatus,
} from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionOptionsDto } from '~/common/dto/transaction-options.dto';
import { AppValidationError } from '~/common/errors';
import { NotificationPayloadModel } from '~/common/models/notification-payload-model';
import { TransactionPayloadResultModel } from '~/common/models/transaction-payload-result.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ProcessMode } from '~/common/types';
import {
  clearEventLoop,
  extractTxOptions,
  generateBase64Secret,
  getNextYearISO,
  handleServiceResult,
  isFungibleLeg,
  isNftLeg,
  isNotNull,
  toArray,
  UnreachableCaseError,
} from '~/common/utils/functions';
import { TransactionUpdatePayload } from '~/events/types';
import { TransactionDetails, TransactionResult } from '~/transactions/transactions.util';
import { ResultType } from '~/transactions/types';

describe('common/utils/functions', () => {
  describe('handleServiceResult', () => {
    it('wraps transaction payload results', () => {
      const transactionPayload: TransactionPayload = {
        payload: {} as never,
        rawPayload: { data: '0x', address: 'addr', type: 'bytes' },
        method: '0x',
        metadata: {},
        multiSig: null,
      };

      const payloadResult = handleServiceResult({
        transactionPayload,
        details: {
          status: TransactionStatus.Idle,
          fees: {} as never,
          supportsSubsidy: false,
          payingAccount: {
            type: PayingAccountType.Caller,
            address: 'addr',
            balance: new BigNumber(0),
          },
        },
      });

      expect(payloadResult).toBeInstanceOf(TransactionPayloadResultModel);
      expect((payloadResult as TransactionPayloadResultModel).transactionPayload).toMatchObject(
        transactionPayload
      );
    });

    it('wraps multisig results into a queue model', () => {
      const multiSigResult = handleServiceResult({
        resultType: ResultType.MultiSigProposal,
        transactions: [{ id: 1 } as unknown as TransactionQueueModel['transactions'][number]],
        details: {
          status: TransactionStatus.Idle,
          fees: {} as never,
          supportsSubsidy: false,
          payingAccount: {
            type: PayingAccountType.Caller,
            address: 'addr',
            balance: new BigNumber(0),
          },
        } as TransactionDetails,
        result: {
          toHuman: () => ({ id: '1', multiSigAddress: 'addr' }),
        } as unknown as MultiSigProposal,
      });

      expect(multiSigResult).toBeInstanceOf(TransactionQueueModel);
      expect((multiSigResult as TransactionQueueModel).transactions).toHaveLength(1);
      expect((multiSigResult as TransactionQueueModel).proposal).toBeDefined();
    });

    it('returns queue model for direct dry-run results', () => {
      const directResult = handleServiceResult({
        resultType: ResultType.Direct,
        transactions: [{ id: 1 } as unknown as TransactionQueueModel['transactions'][number]],
        details: {
          status: TransactionStatus.Idle,
          fees: {} as never,
          supportsSubsidy: false,
          payingAccount: {
            type: PayingAccountType.Caller,
            address: 'addr',
            balance: new BigNumber(0),
          },
        } as TransactionDetails,
        result: {},
        isDryRun: true,
      });

      expect(directResult).toBeInstanceOf(TransactionQueueModel);
      expect((directResult as TransactionQueueModel).details).toMatchObject({
        status: TransactionStatus.Idle,
      });
    });

    it('wraps generic notification payloads', () => {
      const payload = handleServiceResult({ foo: 'bar' } as unknown as NotificationPayloadModel);
      expect(payload).toBeInstanceOf(NotificationPayloadModel);
      expect((payload as NotificationPayloadModel).payload).toBeUndefined();
    });

    it('returns notification payload unchanged', () => {
      const payload = {
        topicName: 'topic',
        nonce: 1,
        subscriptionId: 1,
        payload: {
          status: TransactionStatus.Idle,
          type: 'Single',
          transactionTag: 'SomeTag',
        } as unknown as TransactionUpdatePayload,
        type: 'Event' as never,
      } as NotificationPayloadModel;
      expect(handleServiceResult(payload)).toBe(payload);
    });
  });

  describe('extractTxOptions', () => {
    it('returns provided options when nested', () => {
      const { options, args } = extractTxOptions({
        signer: 'deprecated',
        options: { signer: '0x1', metadata: {} } as TransactionOptionsDto,
        value: 'data',
      } as unknown as TransactionOptionsDto & { value: string });

      expect(options).toMatchObject({ signer: '0x1' });
      expect(args).toMatchObject({ value: 'data' });
    });

    it('builds options when signer is provided', () => {
      const { options, args } = extractTxOptions({
        signer: '0xabc',
        webhookUrl: undefined,
        dryRun: false,
        other: 1,
      } as unknown as TransactionBaseDto & { other: number });

      expect(options.processMode).toBe(ProcessMode.Submit);
      expect(args).toMatchObject({ other: 1 });
    });

    it('sets dry-run and webhook modes', () => {
      const dryRun = extractTxOptions({ signer: '0xabc', dryRun: true } as TransactionBaseDto);
      expect(dryRun.options.processMode).toBe(ProcessMode.DryRun);

      const webhook = extractTxOptions({
        signer: '0xabc',
        webhookUrl: 'https://example.com',
      } as TransactionBaseDto);
      expect(webhook.options.processMode).toBe(ProcessMode.SubmitWithCallback);
      expect(webhook.options.webhookUrl).toBe('https://example.com');
    });

    it('throws when signer is missing without nested options', () => {
      expect(() => extractTxOptions({} as unknown as TransactionBaseDto)).toThrow(
        AppValidationError
      );
    });

    it('throws when deprecated params are mixed with options', () => {
      const someSpy = jest.spyOn(Array.prototype, 'some').mockReturnValue(true);
      expect(() =>
        extractTxOptions({
          options: { signer: '0x1' } as TransactionOptionsDto,
          signer: 'legacy',
        } as TransactionBaseDto)
      ).toThrow(AppValidationError);
      someSpy.mockRestore();
    });
  });

  it('type guards and helpers work as expected', async () => {
    expect(isNotNull(1)).toBe(true);
    expect(isNotNull(null)).toBe(false);

    expect(isFungibleLeg({ amount: new BigNumber(1) } as unknown as Leg)).toBe(true);
    expect(isNftLeg({ nfts: [] } as unknown as Leg)).toBe(true);

    expect(toArray('a,b , c')).toEqual(['a', 'b', 'c']);
    expect(toArray(['x'])).toEqual(['x']);
    expect(toArray(123 as unknown)).toBeUndefined();

    const nextYear = new Date(getNextYearISO()).getFullYear();
    expect(nextYear).toBe(new Date().getFullYear() + 1);

    await clearEventLoop();
  });

  it('uses default resolver for direct results', () => {
    const result = handleServiceResult({
      resultType: ResultType.Direct,
      transactions: [{ id: 1 } as unknown as TransactionQueueModel['transactions'][number]],
      details: {
        status: TransactionStatus.Idle,
        fees: {} as never,
        supportsSubsidy: false,
        payingAccount: {
          type: PayingAccountType.Caller,
          address: 'addr',
          balance: new BigNumber(0),
        },
      } as TransactionDetails,
      result: { value: 1 },
    } as unknown as TransactionResult<unknown>);

    expect(result).toBeInstanceOf(TransactionQueueModel);
  });

  it('generates base64 secrets and throws unreachable error', async () => {
    const secret = await generateBase64Secret(4);
    expect(typeof secret).toBe('string');

    expect(() => {
      throw new UnreachableCaseError('bad' as never);
    }).toThrow('Unreachable case');
  });
});
