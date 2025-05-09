import { 
  FolderPathItem, 
  FileInfo, 
  FileTypeEnum, 
  FileSortInterface, 
  SortDirectionEnum
} from '@/app/types';

/**
 * 文件状态接口
 * 整合了原FileContextType和FileState的功能
 */
export interface FileState {
  // 文件列表状态
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  currentFolderId: string | null;
  folderPath: FolderPathItem[];
  selectedFileType: FileTypeEnum | null;
  selectedFileIds: string[];
  sortOrder: FileSortInterface;
  
  // 获取文件信息
  loadFiles: (folderId?: string | null, type?: FileTypeEnum | null, forceRefresh?: boolean) => Promise<void>;
  loadRecentFiles: (limit?: number) => Promise<void>;
  searchFiles: (query: string, type?: FileTypeEnum) => Promise<void>;
  loadFolderPath: (folderId: string | null) => Promise<void>;
  
  // 文件选择操作
  selectFile: (fileId: string, selected: boolean) => void;
  selectFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
  
  // 文件排序
  setSortOrder: (sortOrder: FileSortInterface) => void;
  
  // 文件操作
  deleteFiles: (fileIds: string[], onSuccess?: () => void) => Promise<boolean>;
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  renameFile: (fileId: string, newName: string) => Promise<FileInfo | null>;
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
  
  // 工具方法
  resetState: () => void;
  
  // 从FileContextType迁移的方法
  updateFileSort: (sortOrder: FileSortInterface) => void;
  setFileType: (type: FileTypeEnum | null) => void;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
} 