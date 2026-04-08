import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  connect,
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
  type GetMessage,
  type Options,
} from 'amqplib';
import { Subject, Subscription } from 'rxjs';
import { Topics } from '../common/constants/topics';
import { filter } from 'rxjs/operators';

export interface MessageEnvelope<TPayload> {
  topic: string;
  payload: TPayload;
  publishedAt: string;
}

type Handler<TPayload> = (payload: TPayload) => Promise<void> | void;

interface PublishOptions {
  headers?: Record<string, unknown>;
}

interface SubscriptionOptions {
  consumerName?: string;
}

export interface MessageBusHealthSnapshot {
  mode: 'rabbitmq' | 'memory';
  connected: boolean;
  exchange: string;
}

export interface DlqMessageSnapshot<TPayload = unknown> {
  messageId: string;
  topic: string;
  payload: TPayload;
  publishedAt: string;
  retryCount: number;
  finalError: string | null;
}

@Injectable()
export class MessageBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageBusService.name);
  private readonly subject = new Subject<MessageEnvelope<unknown>>();
  private readonly subscriptions: Subscription[] = [];
  private readonly handlerRegistry = new Map<string, Set<Handler<unknown>>>();
  private readonly handlerConsumerNames = new WeakMap<
    Handler<unknown>,
    string
  >();

  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchange = 'vela.events';
  private readonly retryExchange = 'vela.retry';
  private readonly dlqExchange = 'vela.dlq';
  private readonly deliveryRetryDelayMs = Number(
    process.env.RABBITMQ_DELIVERY_RETRY_DELAY_MS ?? 30_000,
  );
  private readonly deliveryMaxRetries = Number(
    process.env.RABBITMQ_DELIVERY_MAX_RETRIES ?? 3,
  );
  private rabbitEnabled = false;

  async onModuleInit(): Promise<void> {
    const rabbitUrl = process.env.RABBITMQ_URL;

    if (!rabbitUrl || process.env.SKIP_RABBITMQ === 'true') {
      this.logger.log('Message bus running in local in-memory mode');
      return;
    }

    try {
      const connection = await connect(rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });
      await channel.assertExchange(this.retryExchange, 'topic', {
        durable: true,
      });
      await channel.assertExchange(this.dlqExchange, 'topic', {
        durable: true,
      });
      this.connection = connection;
      this.channel = channel;
      this.rabbitEnabled = true;
      this.logger.log('RabbitMQ message bus connected');

      for (const [topic, handlers] of this.handlerRegistry.entries()) {
        for (const handler of handlers) {
          await this.bindRabbitConsumer(
            topic,
            handler,
            this.handlerConsumerNames.get(handler),
          );
        }
      }
    } catch (error) {
      const rendered = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Falling back to in-memory message bus: ${rendered}`);
      this.rabbitEnabled = false;
      this.channel = null;
      this.connection = null;
    }
  }

  publish<TPayload>(
    topic: string,
    payload: TPayload,
    options?: PublishOptions,
  ): Promise<void> {
    const envelope: MessageEnvelope<TPayload> = {
      topic,
      payload,
      publishedAt: new Date().toISOString(),
    };

    if (!this.rabbitEnabled || !this.channel) {
      this.subject.next(envelope);
      return Promise.resolve();
    }

    this.channel.publish(
      this.exchange,
      topic,
      Buffer.from(JSON.stringify(envelope), 'utf8'),
      {
        persistent: true,
        headers: options?.headers,
      },
    );
    return Promise.resolve();
  }

  subscribe<TPayload>(
    topic: string,
    handler: Handler<TPayload>,
    options?: SubscriptionOptions,
  ): void {
    const handlers =
      this.handlerRegistry.get(topic) ?? new Set<Handler<unknown>>();
    handlers.add(handler as Handler<unknown>);
    this.handlerRegistry.set(topic, handlers);
    if (options?.consumerName) {
      this.handlerConsumerNames.set(
        handler as Handler<unknown>,
        options.consumerName,
      );
    }

    if (this.rabbitEnabled && this.channel) {
      void this.bindRabbitConsumer(
        topic,
        handler as Handler<unknown>,
        options?.consumerName,
      );
      return;
    }

    const subscription = this.subject
      .pipe(filter((message) => message.topic === topic))
      .subscribe({
        next: (message) => {
          void Promise.resolve(handler(message.payload as TPayload)).catch(
            (error) => {
              const rendered =
                error instanceof Error ? error.message : String(error);
              this.logger.error(
                `Message handler failed for ${topic}: ${rendered}`,
              );
            },
          );
        },
      });

    this.subscriptions.push(subscription);
  }

  async onModuleDestroy(): Promise<void> {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subject.complete();

    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }
  }

  getHealthSnapshot(): MessageBusHealthSnapshot {
    return {
      mode: this.rabbitEnabled ? 'rabbitmq' : 'memory',
      connected: this.rabbitEnabled
        ? Boolean(this.channel && this.connection)
        : true,
      exchange: this.exchange,
    };
  }

  async checkReadiness(): Promise<MessageBusHealthSnapshot> {
    if (!process.env.RABBITMQ_URL || process.env.SKIP_RABBITMQ === 'true') {
      return this.getHealthSnapshot();
    }

    if (!this.channel || !this.connection || !this.rabbitEnabled) {
      throw new Error('RabbitMQ transport is not connected');
    }

    await this.channel.checkExchange(this.exchange);
    return this.getHealthSnapshot();
  }

  async inspectDlq<TPayload>(
    topic: string,
    consumerName: string,
    limit = 25,
  ): Promise<DlqMessageSnapshot<TPayload>[]> {
    const channel = this.requireRabbitChannel();
    const queueName = `${this.buildQueueName(topic, consumerName)}.dlq`;
    const collected = await this.collectQueueMessages(queueName, limit);

    try {
      return collected.map(({ message, envelope }) => ({
        messageId: message.properties.messageId ?? randomUUID(),
        topic: envelope.topic,
        payload: envelope.payload as TPayload,
        publishedAt: envelope.publishedAt,
        retryCount: this.getRetryCount(message),
        finalError:
          typeof message.properties.headers?.['x-final-error'] === 'string'
            ? message.properties.headers['x-final-error']
            : null,
      }));
    } finally {
      collected.forEach(({ message }) => channel.nack(message, false, true));
    }
  }

  async replayDlq<TPayload>(
    topic: string,
    consumerName: string,
    options?: {
      limit?: number;
      match?: (payload: TPayload) => boolean;
      transform?: (payload: TPayload) => TPayload;
    },
  ): Promise<{ inspected: number; replayed: number; remaining: number }> {
    const channel = this.requireRabbitChannel();
    const queueName = `${this.buildQueueName(topic, consumerName)}.dlq`;
    const current = await channel.checkQueue(queueName);
    const targetCount = options?.limit
      ? Math.max(options.limit, 1)
      : current.messageCount;
    const collected = await this.collectQueueMessages(queueName, targetCount);

    let replayed = 0;

    for (const { message, envelope } of collected) {
      const payload = envelope.payload as TPayload;
      const shouldReplay = options?.match ? options.match(payload) : true;

      if (shouldReplay) {
        const nextPayload = options?.transform
          ? options.transform(payload)
          : payload;

        channel.publish(
          this.exchange,
          topic,
          Buffer.from(
            JSON.stringify({
              ...envelope,
              payload: nextPayload,
              publishedAt: new Date().toISOString(),
            } satisfies MessageEnvelope<TPayload>),
            'utf8',
          ),
          {
            persistent: true,
            headers: {
              'x-retry-count': 0,
              'x-replayed-from-dlq': true,
            },
          },
        );
        channel.ack(message);
        replayed += 1;
        continue;
      }

      channel.nack(message, false, true);
    }

    const remaining = (await channel.checkQueue(queueName)).messageCount;
    return {
      inspected: collected.length,
      replayed,
      remaining,
    };
  }

  private async bindRabbitConsumer(
    topic: string,
    handler: Handler<unknown>,
    consumerName?: string,
  ): Promise<void> {
    if (!this.channel) {
      return;
    }

    const queueName = this.buildQueueName(topic, consumerName);
    await this.channel.prefetch(10);
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, this.exchange, topic);
    await this.assertRetryTopology(topic, queueName);
    await this.channel.consume(queueName, (message) => {
      if (!message) {
        return;
      }

      void this.handleRabbitMessage(topic, handler, message);
    });
  }

  private async handleRabbitMessage(
    topic: string,
    handler: Handler<unknown>,
    message: ConsumeMessage,
  ): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      const envelope = JSON.parse(
        message.content.toString('utf8'),
      ) as MessageEnvelope<unknown>;
      await handler(envelope.payload);
      this.channel.ack(message);
    } catch (error) {
      const rendered = error instanceof Error ? error.message : String(error);
      this.logger.error(`RabbitMQ handler failed for ${topic}: ${rendered}`);
      this.handleRabbitFailure(topic, message, error);
    }
  }

  private async assertRetryTopology(
    topic: string,
    queueName: string,
  ): Promise<void> {
    if (!this.channel || topic !== Topics.NOTIFICATIONS_DELIVER) {
      return;
    }

    const retryQueueName = `${queueName}.retry`;
    const dlqQueueName = `${queueName}.dlq`;

    await this.channel.assertQueue(retryQueueName, {
      durable: true,
      deadLetterExchange: this.exchange,
      deadLetterRoutingKey: topic,
    });
    await this.channel.bindQueue(retryQueueName, this.retryExchange, topic);

    await this.channel.assertQueue(dlqQueueName, { durable: true });
    await this.channel.bindQueue(dlqQueueName, this.dlqExchange, topic);
  }

  private buildQueueName(topic: string, consumerName?: string): string {
    const suffix = consumerName ? `.${consumerName}` : '';
    return `vela.${topic}${suffix}`.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private getRetryCount(message: ConsumeMessage | GetMessage): number {
    const headerValue = message.properties.headers?.['x-retry-count'];

    if (typeof headerValue === 'number') {
      return headerValue;
    }

    if (typeof headerValue === 'string') {
      const parsed = Number.parseInt(headerValue, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private handleRabbitFailure(
    topic: string,
    message: ConsumeMessage,
    error: unknown,
  ): void {
    if (!this.channel) {
      return;
    }

    if (topic !== Topics.NOTIFICATIONS_DELIVER) {
      this.channel.nack(message, false, false);
      return;
    }

    const retryCount = this.getRetryCount(message);
    const rendered = error instanceof Error ? error.message : String(error);

    if (retryCount < this.deliveryMaxRetries) {
      const envelope = JSON.parse(
        message.content.toString('utf8'),
      ) as MessageEnvelope<Record<string, unknown>>;
      const retriedEnvelope = this.createRetryEnvelope(
        envelope,
        retryCount + 1,
      );

      this.channel.publish(
        this.retryExchange,
        topic,
        Buffer.from(JSON.stringify(retriedEnvelope), 'utf8'),
        {
          persistent: true,
          expiration: String(this.deliveryRetryDelayMs),
          headers: {
            ...(message.properties.headers ?? {}),
            'x-retry-count': retryCount + 1,
            'x-last-error': rendered,
          },
        },
      );
      this.logger.warn(
        `Scheduled retry ${retryCount + 1}/${this.deliveryMaxRetries} for ${topic}`,
      );
      this.channel.ack(message);
      return;
    }

    this.channel.publish(this.dlqExchange, topic, message.content, {
      persistent: true,
      messageId: message.properties.messageId ?? randomUUID(),
      headers: {
        ...(message.properties.headers ?? {}),
        'x-retry-count': retryCount,
        'x-final-error': rendered,
      },
    } satisfies Options.Publish);
    this.logger.error(
      `Moved ${topic} message to DLQ after ${retryCount} retries`,
    );
    this.channel.ack(message);
  }

  private createRetryEnvelope(
    envelope: MessageEnvelope<Record<string, unknown>>,
    attemptNumber: number,
  ): MessageEnvelope<Record<string, unknown>> {
    const payload =
      envelope.payload && typeof envelope.payload === 'object'
        ? {
            ...envelope.payload,
            attemptNumber,
          }
        : envelope.payload;

    return {
      ...envelope,
      payload,
      publishedAt: new Date().toISOString(),
    };
  }

  private requireRabbitChannel(): Channel {
    if (!this.rabbitEnabled || !this.channel) {
      throw new BadRequestException(
        'DLQ operations require RabbitMQ mode to be enabled',
      );
    }

    return this.channel;
  }

  private async collectQueueMessages(
    queueName: string,
    limit: number,
  ): Promise<
    Array<{
      message: GetMessage;
      envelope: MessageEnvelope<unknown>;
    }>
  > {
    const channel = this.requireRabbitChannel();
    const queueInfo = await channel.checkQueue(queueName);
    const target = Math.min(Math.max(limit, 1), queueInfo.messageCount);
    const collected: Array<{
      message: GetMessage;
      envelope: MessageEnvelope<unknown>;
    }> = [];

    for (let index = 0; index < target; index += 1) {
      const message = await channel.get(queueName, { noAck: false });

      if (!message) {
        break;
      }

      collected.push({
        message,
        envelope: JSON.parse(
          message.content.toString('utf8'),
        ) as MessageEnvelope<unknown>,
      });
    }

    return collected;
  }
}
