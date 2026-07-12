import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'model_processing',
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
  console.log('[Worker] RabbitMQ kapcsolat létrejött. Várakozás a model_processing queue üzeneteire...');
}

bootstrap();
