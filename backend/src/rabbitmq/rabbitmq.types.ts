export interface JobMessage {
  jobId: string;
  modelId: string;
  jobType: string;
  storageKey: string;
  fileName: string;
  format: string;
}

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
}
