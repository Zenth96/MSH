import type { ProjectStatus, ModelStatus } from './project.model';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

export function projectStatusVariant(status: ProjectStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE': return 'default';
    case 'DRAFT': return 'secondary';
    case 'ARCHIVED': return 'outline';
  }
}

export function modelStatusVariant(status: ModelStatus): BadgeVariant {
  switch (status) {
    case 'READY': return 'default';
    case 'UPLOADING': return 'secondary';
    case 'PROCESSING': return 'outline';
    case 'ERROR': return 'destructive';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function extractErrorMessage(err: any, fallback: string): string {
  return err.error?.message || err.message || fallback;
}

export const PROJECT_STATUSES = ['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

export type ProjectFilterStatus = (typeof PROJECT_STATUSES)[number];
