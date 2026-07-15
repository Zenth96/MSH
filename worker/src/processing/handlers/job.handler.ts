export interface JobMessage {
  jobId: string;
  modelId: string;
  jobType: string;
  storageKey: string;
  fileName: string;
  format: string;
}

export interface JobHandler {
  handle(message: JobMessage): Promise<void>;
}
