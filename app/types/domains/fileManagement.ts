import { FolderPathItem, FileTypeEnum, SortOrder } from './fileTypes';

/**
 * 文件管理系统类型定义
 * 
 * 本文件包含所有与文件管理相关的类型定义，按以下分类组织：
 * 1. 核心数据模型 - 如File, Folder等
 * 2. 组件Props - 如FileListProps, RenameModalProps等
 * 3. Hooks接口 - 如FileOperationsHook, FileSearchHook等
 * 4. 辅助类型 - 如FileState等
 */

// ----------------------------------------------------------------------------
// 核心数据模型
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
 * 文件状态
 */
export interface FileState {
  files: ExtendedFile[];
  selectedFiles: string[];
  currentFolderId: string | null;
  folderPath: FolderPathItem[];
  isLoading: boolean;
  error: string | null;
  sortOrder: SortOrder;
  selectedFileType: FileTypeEnum | null;
}

// ----------------------------------------------------------------------------
// 组件Props
// ----------------------------------------------------------------------------

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
 */
export interface FileContextType {
  // 状态
  files: ExtendedFile[];
  selectedFiles: string[];
  currentFolderId: string | null;
  folderPath: FolderPathItem[];
  isLoading: boolean;
  error: string | null;
  sortOrder: SortOrder;
  selectedFileType: FileTypeEnum | null;

  // 方法
  loadFiles: (folderId?: string | null) => Promise<void>;
  selectFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
  updateFileSort: (sortOrder: SortOrder) => void;
  setFileType: (type: FileTypeEnum | null) => void;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
}

// ----------------------------------------------------------------------------
// Hooks接口
// ----------------------------------------------------------------------------

/**
 * 文件操作Hook接口
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
 */
export interface FileSearchHook {
  isSearching: boolean;
  searchError: string | null;
  searchResults: ExtendedFile[];
  handleSearch: (query: string, fileType: string | null) => Promise<void>;
}

/**
 * 文件上传Hook接口
 */
export interface FileUploadHook {
  isUploading: boolean;
  uploadProgress: number;
  handleUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
  handleFolderUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
}

/**
 * 搜索视图组件Props
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