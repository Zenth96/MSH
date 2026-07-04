import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: 0,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'model_processing',
      queueOptions: { durable: false },
    },
  });
  await app.listen();
  console.log('Worker is listening for jobs...');
}
bootstrap();
