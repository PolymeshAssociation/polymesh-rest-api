import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TransactionStatus } from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/utils';

import { TransactionOptionsDto } from '~/common/dto/transaction-options.dto';
import { TransactionType } from '~/common/types';
import { EventsService } from '~/events/events.service';
import { EventType, TransactionUpdateEvent, TransactionUpdatePayload } from '~/events/types';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { NotificationPayload } from '~/notifications/types';
import { SigningService } from '~/signing/services/signing.service';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import { SubscriptionStatus } from '~/subscriptions/types';
import transactionsConfig from '~/transactions/config/transactions.config';
import {
  handleSdkError,
  Method,
  prepareProcedure,
  processTransaction,
  TransactionPayloadResult,
  TransactionResult,
} from '~/transactions/transactions.util';
import { Transaction } from '~/transactions/types';

@Injectable()
export class TransactionsService {
  // TODO @polymath-eric: use tx bytes instead of numeric id when we support transaction serdes in the SDK
  /**
   * in-memory transaction store by Transaction Identifier. We use a Map
   *   to be able to recycle indexes easily and remove elements in a performant way
   */
  private transactionStore: Map<
    number,
    {
      /**
       * transaction identifier
       */
      id: number;
      /**
       * transaction object
       */
      transaction: Transaction;
      /**
       * callback to unsubscribe from status updates
       */
      unsubCallback: () => void;
    }
  > = new Map();

  private currentId = 0;
  private legitimacySecret: string;

  constructor(
    @Inject(transactionsConfig.KEY) config: ConfigType<typeof transactionsConfig>,
    private readonly eventsService: EventsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly signingService: SigningService,
    // TODO @polymath-eric handle errors with specialized service
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(TransactionsService.name);
    this.legitimacySecret = config.legitimacySecret;
  }

  public async getSigningAccount(signer: string): Promise<string> {
    const isAddress = this.signingService.isAddress(signer);
    if (isAddress) {
      return signer;
    }

    return this.signingService.getAddressByHandle(signer);
  }

  public async submit<MethodArgs, ReturnType, TransformedReturnType = ReturnType>(
    method: Method<MethodArgs, ReturnType, TransformedReturnType>,
    args: MethodArgs,
    transactionOptions: TransactionOptionsDto
  ): Promise<
    TransactionPayloadResult | NotificationPayload | TransactionResult<TransformedReturnType>
  > {
    const { signer, webhookUrl } = transactionOptions;
    const signingAccount = await this.getSigningAccount(signer);
    try {
      if (!webhookUrl) {
        return processTransaction(method, args, { signingAccount }, transactionOptions);
      } else {
        // prepare the procedure so the SDK will run its validation and throw if something isn't right
        const transaction = await prepareProcedure(method, args, { signingAccount });

        return this.submitAndSubscribe(
          transaction as Transaction,
          webhookUrl,
          this.legitimacySecret
        );
      }
    } catch (error) {
      /* istanbul ignore next */
      throw handleSdkError(error);
    }
  }

  /**
   * Submit a transaction and listen for changes on it
   *
   * @returns initial transaction status notification
   */
  private async submitAndSubscribe(
    transaction: Transaction,
    webhookUrl: string,
    legitimacySecret: string
  ): Promise<NotificationPayload<EventType.TransactionUpdate>> {
    const { subscriptionsService, logger } = this;
    const id = this.addListener(transaction);
    const eventScope = String(id);
    const eventType = EventType.TransactionUpdate;

    const subscriptionId = await subscriptionsService.createSubscription({
      eventType,
      eventScope,
      webhookUrl,
      legitimacySecret,
    });

    // since we're sending an "initial" notification with nonce 0 as a response, we start with the nonce at 1
    await subscriptionsService.updateSubscription(subscriptionId, {
      nextNonce: 1,
    });

    // TODO @polymath-eric: use dedicated error service
    // we don't propagate transaction errors because they're sent as status updates
    transaction
      .run()
      .catch(({ message, stack }: Error) =>
        logger.error(`Error while running transaction "${id}": ${message}`, stack)
      );

    return {
      subscriptionId,
      type: eventType,
      scope: eventScope,
      payload: this.assemblePayload(transaction),
      nonce: 0,
    };
  }

  /**
   * Adds a listener for a transaction and returns the internal transaction ID
   */
  private addListener(transaction: Transaction): number {
    const { transactionStore } = this;

    this.currentId += 1;
    const id = this.currentId;

    const unsubCallback = transaction.onStatusChange(tx =>
      this.handleTransactionStatusChange(id, tx)
    );

    transactionStore.set(id, {
      id,
      transaction,
      unsubCallback,
    });

    return id;
  }

  /**
   * Create a transaction update event with a payload based on the current transaction status
   *
   * @param id - internal transaction ID
   */
  private async handleTransactionStatusChange(id: number, transaction: Transaction): Promise<void> {
    /*
     * we save the status into a variable in case it changes while
     *   creating the event and notifications
     *   (the transaction object is mutated by the SDK)
     */
    const { status } = transaction;

    try {
      await this.eventsService.createEvent<TransactionUpdateEvent>({
        type: EventType.TransactionUpdate,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        scope: String(id), // TODO @polymath-eric: replace with bytes when we have tx serdes
        payload: this.assemblePayload(transaction),
      });

      // terminal states
      if (
        [
          TransactionStatus.Aborted,
          TransactionStatus.Failed,
          TransactionStatus.Rejected,
          TransactionStatus.Succeeded,
        ].includes(status)
      ) {
        const { transactionStore } = this;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const txData = transactionStore.get(id)!;
        txData.unsubCallback();
        transactionStore.delete(id);

        await this.markSubsAsDone(id);
      }
    } catch (err) {
      this.logger.error(
        `Error while handling status change for transaction "${id}"`,
        (err as Error).message || JSON.stringify(err)
      );
    }
  }

  /**
   * Mark all active, non-expired subscriptions listening to a transaction as "done". This is used
   *   when the transaction has reached a terminal state
   *
   * @param id - internal transaction ID
   */
  private async markSubsAsDone(id: number): Promise<void> {
    const { subscriptionsService } = this;

    const affectedSubscriptions = await subscriptionsService.findAll({
      eventType: EventType.TransactionUpdate,
      eventScope: String(id),
      status: SubscriptionStatus.Active,
      excludeExpired: true,
    });

    await subscriptionsService.batchMarkAsDone(affectedSubscriptions.map(({ id: subId }) => subId));
  }

  /**
   * Create an event payload for a transaction status update
   *
   * @note this is very type unsafe, but there's no real way around it without making it horribly unreadable
   */
  private assemblePayload(transaction: Transaction): TransactionUpdatePayload {
    const { status, txHash, blockHash, blockNumber } = transaction;

    let payload: Record<string, unknown> = {
      status,
    };

    if (isPolymeshTransaction(transaction)) {
      payload = {
        ...payload,
        type: TransactionType.Single,
        transactionTag: transaction.tag,
      };
    } else {
      payload = {
        ...payload,
        type: TransactionType.Batch,
        transactionTags: transaction.transactions.map(({ tag }) => tag),
      };
    }

    // only if the transaction was actually signed we include the hash
    if (
      ![TransactionStatus.Rejected, TransactionStatus.Unapproved, TransactionStatus.Idle].includes(
        status
      )
    ) {
      payload = {
        ...payload,
        transactionHash: txHash,
      };
    }

    // transaction in block (block hash and number are definitely defined)
    if ([TransactionStatus.Succeeded, TransactionStatus.Failed].includes(status)) {
      payload = {
        ...payload,
        blockHash,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        blockNumber: blockNumber!.toString(),
      };

      if (status === TransactionStatus.Succeeded) {
        payload.result = 'placeholder'; // The SDK needs to support returning this (DA-407)
      }
    }

    // transaction error
    if (
      [TransactionStatus.Aborted, TransactionStatus.Failed, TransactionStatus.Rejected].includes(
        status
      )
    ) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      payload.error = transaction.error!.message;
    }

    return payload as unknown as TransactionUpdatePayload;
  }
}
