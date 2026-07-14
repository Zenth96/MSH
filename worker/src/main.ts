import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ProcessingService } from './processing/processing.service.js';
import type { JobMessage } from './processing/handlers/job.handler.js';
import * as amqp from 'amqplib';

const logger = new Logger('Worker');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();

  const processingService = app.get(ProcessingService);

  const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queue = 'model_processing';

  let connection!: amqp.ChannelModel;
  let channel!: amqp.Channel;

  const connectWithRetry = async (retries = 10, delay = 3000): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: true });
        channel.prefetch(1);
        logger.log(`Connected to RabbitMQ (${url})`);
        return;
      } catch {
        logger.warn(`RabbitMQ not available (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error(`Failed to connect to RabbitMQ after ${retries} attempts`);
  };

  await connectWithRetry();

  logger.log(`Listening on queue: ${queue}`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const content = msg.content.toString();
      const message: JobMessage = JSON.parse(content);
      logger.log(`Received job: ${message.jobId} [${message.jobType}]`);

      await processingService.processJob(message);
      channel.ack(msg);
    } catch (error) {
      logger.error(`Failed to process message: ${error}`);
      channel.nack(msg, false, false);
    }
  });

  process.on('SIGTERM', async () => {
    logger.log('Shutting down...');
    await channel?.close();
    await connection?.close();
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  logger.error(`Worker failed to start: ${err}`);
  process.exit(1);
});
