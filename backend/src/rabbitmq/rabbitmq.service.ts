import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { RABBITMQ_DEFAULT_CONFIG } from './rabbitmq.config.js';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  private readonly url = RABBITMQ_DEFAULT_CONFIG.url;
  private readonly exchange = RABBITMQ_DEFAULT_CONFIG.exchange;

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      await this.assertQueue('model_processing');
      await this.bindQueue('model_processing', 'model.*');
    } catch {
      this.logger.warn('RabbitMQ unavailable — publishing disabled');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async connect(): Promise<void> {
    if (this.connection) return;

    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      this.logger.log(`Connected to RabbitMQ (${this.url})`);
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async publish(routingKey: string, message: object): Promise<boolean> {
    const channel = await this.getChannel();

    const payload = Buffer.from(JSON.stringify(message));

    const result = channel.publish(this.exchange, routingKey, payload, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    });

    this.logger.log(`Published to ${routingKey}: ${JSON.stringify(message)}`);

    return result;
  }

  async assertQueue(
    queue: string,
    options?: amqp.Options.AssertQueue,
  ): Promise<amqp.Replies.AssertQueue> {
    const channel = await this.getChannel();

    return channel.assertQueue(queue, { durable: true, ...options });
  }

  async bindQueue(
    queue: string,
    routingKey: string,
  ): Promise<amqp.Replies.Empty> {
    const channel = await this.getChannel();

    return channel.bindQueue(queue, this.exchange, routingKey);
  }

  private async getChannel(): Promise<amqp.Channel> {
    if (!this.channel) {
      await this.connect();
    }

    return this.channel!;
  }

  private async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
