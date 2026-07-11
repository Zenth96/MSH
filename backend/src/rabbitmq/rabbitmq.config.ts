import type { RabbitMQConfig } from './rabbitmq.types.js';

export const RABBITMQ_DEFAULT_CONFIG: RabbitMQConfig = {
  url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  exchange: 'model_events',
  queue: 'model_processing',
};

export const ROUTING_KEYS = {
  OPTIMIZE: 'model.OPTIMIZE',
  CONVERT: 'model.CONVERT',
  GENERATE_THUMBNAIL: 'model.GENERATE_THUMBNAIL',
} as const;
