import { FileTypeEnum } from '../domains/fileTypes';
import { PaginationParams } from '../core/common';

export interface SearchFilesRequest extends Partial<PaginationParams> {
  query: string;
  type?: FileTypeEnum | string;
  tags?: string[];
  includeFolder?: boolean;
  searchMode?: 'name' | 'tag';
}

export interface UploadFileRequest {
  file: File;
  folderId?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
}

export interface RenameFileRequest {
  id: string;
  name: string;
  tags?: string[];
}

export interface MoveFileRequest {
  id: string;
  targetFolderId: string | null;
}

export interface BulkMoveRequest {
  ids: string[];
  targetFolderId: string | null;
}

export interface DeleteFileRequest {
  id: string;
  permanent?: boolean;
}

export interface BulkDeleteRequest {
  ids: string[];
  permanent?: boolean;
}

export interface RestoreFileRequest {
  id: string;
}

export interface BulkRestoreRequest {
  ids: string[];
}

export interface UpdateTagsRequest {
  id: string;
  tags: string[];
}

export interface BulkUpdateTagsRequest {
  ids: string[];
  tags: string[];
  mode: 'replace' | 'add' | 'remove';
} 