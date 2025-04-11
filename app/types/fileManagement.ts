import { FileType, FileInfo, SortOrder, FolderPath } from './file';

/**
 * 文件管理系统类型定义
 * 
 * 本文件包含所有与文件管理UI组件和功能相关的类型定义，按以下分类组织：
 * 1. 组件Props - 如FileListProps, UploadModalProps等
 * 2. 上下文类型 - 如FileContextType
 * 3. Hooks接口 - 如FileOperationsHook, FileSearchHook等
 * 4. 扩展数据模型 - 如ExtendedFile, UserProfile等
 */

// ----------------------------------------------------------------------------
// 扩展数据模型
// ----------------------------------------------------------------------------

/**
 * 基础文件类型，包含文件的共同属性
 */
export interface FileBase {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  parentId?: string | null;
  createdAt: string | Date;
  updatedAt: string;
}

/**
 * 文件类型
 */
export interface FileItem extends FileBase {
  type: 'file' | string;
  extension?: string;
  mimeType?: string;
}

/**
 * 文件夹类型
 */
export interface Folder extends FileBase {
  type: 'folder';
  itemCount?: number;
  isFolder: true;
}

/**
 * 扩展文件类型，包含附加属性
 */
export interface ExtendedFile extends Omit<FileBase, 'isFolder'> {
  size: number;
  type?: string;
  extension?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isFolder?: boolean;
  mimeType?: string;
  selected?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  fullPath?: string;
  isDeleted?: boolean;
  uploaderId?: string;
}

/**
 * 用户资料类型
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  storageUsed?: number;
  storageLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 文件状态接口
 * @deprecated 此接口已废弃，请使用 AppState['files'] 类型，位于 app/file_management/context/AppStateContext.tsx
 */
export interface FileState {
  files: ExtendedFile[];
  selectedFiles: string[];
  currentFolderId: string | null;
  folderPath: FolderPath[];
  isLoading: boolean;
  error: string | null;
  sortOrder: SortOrder;
  selectedFileType: FileType | null;
}

// ----------------------------------------------------------------------------
// 组件Props
// ----------------------------------------------------------------------------

/**
 * 文件上传组件Props
 */
export interface FileUploadProps {
  onUploadComplete: (file: FileInfo) => void;
  folderId?: string | null;
  accept?: string;
  multiple?: boolean;
  withTags?: boolean;
  isFolderUpload?: boolean;
}

/**
 * 文件列表组件Props
 */
export interface FileListProps {
  files: ExtendedFile[];
  onFileClick?: (file: ExtendedFile) => void;
  onDelete?: (fileIds: string[]) => Promise<void> | void;
  onMove?: (fileIds: string[], targetFolderId: string) => Promise<void> | void;
}

/**
 * 上传模态框Props
 */
export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  isFolderUpload: boolean;
  withTags: boolean;
  currentFolderId?: string | null;
}

/**
 * 重命名模态框Props
 */
export interface RenameModalProps {
  visible: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm: (name: string, extension?: string) => void;
  fileName?: string;
  currentName?: string;
  extension?: string;
}

/**
 * 文件上下文类型
 * @deprecated 此接口已废弃，请使用 AppState 类型和相应的 useApp* hooks，位于 app/file_management/context/AppStateContext.tsx
 */
export interface FileContextType {
  // 状态
  files: ExtendedFile[];
  selectedFiles: string[];
  currentFolderId: string | null;
  folderPath: FolderPath[];
  isLoading: boolean;
  error: string | null;
  sortOrder: SortOrder;
  selectedFileType: FileType | null;

  // 方法
  loadFiles: (folderId?: string | null) => Promise<void>;
  selectFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
  updateFileSort: (sortOrder: SortOrder) => void;
  setFileType: (type: FileType | null) => void;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
}

// ----------------------------------------------------------------------------
// Hooks接口
// ----------------------------------------------------------------------------

/**
 * 文件操作Hook接口
 * @deprecated 此接口已废弃，请使用 useAppFileActions hook，位于 app/file_management/hooks/useAppFileActions.ts
 */
export interface FileOperationsHook {
  loading: boolean;
  handleMove: (fileIds: string[], targetFolderId: string) => Promise<void>;
  handleDownload: (fileIds: string[]) => Promise<void>;
  startEditing: (file: FileItem) => void;
  handleRename: () => Promise<void>;
  handleCreateFolder: () => Promise<void>;
  isRenameModalVisible: boolean;
  setIsRenameModalVisible: (visible: boolean) => void;
  editingFile: FileItem | null;
  newFileName: string;
  setNewFileName: (name: string) => void;
  newExtension: string;
  setNewExtension: (ext: string) => void;
  isCreateFolderModalVisible: boolean;
  setIsCreateFolderModalVisible: (visible: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  newFolderTags: string;
  setNewFolderTags: (tags: string) => void;
}

/**
 * 文件搜索Hook接口
 * @deprecated 此接口已废弃，请使用 useAppSearch hook，位于 app/file_management/hooks/useAppSearch.ts
 */
export interface FileSearchHook {
  isSearching: boolean;
  searchError: string | null;
  searchResults: ExtendedFile[];
  handleSearch: (query: string, fileType: string | null) => Promise<void>;
}

/**
 * 文件上传Hook接口
 * @deprecated 此接口已废弃，请使用全局状态管理的文件上传实现
 */
export interface FileUploadHook {
  isUploading: boolean;
  uploadProgress: number;
  handleUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
  handleFolderUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
}

/**
 * 搜索视图Props
 */
export interface SearchViewProps {
  results: ExtendedFile[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  onResultClick?: (file: ExtendedFile) => void;
  onFileSelect?: (fileId: string, selected: boolean) => void;
  onDownload?: (fileId: string) => void;
  onRename?: (file: ExtendedFile) => void;
  onClearSearch?: () => void;
} 