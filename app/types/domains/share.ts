/**
 * 文件分享类型定义
 */

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  isFolder: boolean;
}

export interface ShareInfo {
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  files: SharedFile[];
}

export interface FolderContent {
  id: string;
  name: string;
  type: string;
  size: number;
  isFolder: boolean;
  createdAt: string;
}

export interface FolderInfo {
  contents: FolderContent[];
  folderId: string;
  folderName: string;
}

export interface ShareOptions {
  fileIds: string[];
  expiryDays: number;
  extractCode?: string;
  accessLimit?: number | null;
  autoRefreshCode?: boolean;
}

export interface ShareResult {
  shareId: string;
  shareCode: string;
  extractCode: string | null;
  shareUrl: string;
  expiresAt: string | null;
}

export interface ShareItem {
  id: string;
  shareCode: string;
  extractCode: string;
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  createdAt: string;
  files: SharedFile[];
} 