export interface FileWithProgress extends File {
  id: string;
  relativePath: string;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  };
}

export interface UploadProgress {
  [key: string]: FileWithProgress;
}

export interface FolderStructure {
  path: string;
  files: FileWithProgress[];
  subFolders: Map<string, FolderStructure>;
}

export interface FileResponse {
  id: string;
  name: string;
  type: string | null;
  size: number | null;
  isFolder: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  url: string;
} 