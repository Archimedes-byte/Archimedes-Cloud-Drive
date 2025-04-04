import { FileType } from '@/lib/file/utils';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  tags: string[];
}

export interface FolderInfo {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  children?: FileTreeNode[];
  file?: File & { webkitRelativePath?: string };
}

export interface FileUploadProps {
  onUploadComplete: () => void;
  folderId?: string | null;
  withTags?: boolean;
  isFolderUpload?: boolean;
}

export interface StorageUsageProps {
  used: number;
  total: number;
} 