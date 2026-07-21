export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  models?: Model3D[];
}

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Model3D {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  format: string;
  storageKey: string;
  thumbnailKey?: string;
  refStorageKeys?: string[];
  status: ModelStatus;
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ModelStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR';

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}
