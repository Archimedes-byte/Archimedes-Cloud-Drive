/**
 * 文件管理系统类型定义
 * 
 * 本文件包含所有与文件管理相关的类型定义，按以下分类组织：
 * 1. 核心数据模型 - 如File, Folder等
 * 2. 枚举和常量 - 如FileType和类型映射
 * 3. 组件Props - 如FileListProps, RenameModalProps等
 * 4. Hooks接口 - 如FileOperationsHook, FileSearchHook等
 * 5. 辅助类型 - 如SortOrder, FolderPath等
 */

// ----------------------------------------------------------------------------
// 核心数据模型
// ----------------------------------------------------------------------------

/**
 * 基础文件类型，包含文件的共同属性
 * 注意: 不要与DOM的File类型混淆
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
export interface File extends FileBase {
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

// ----------------------------------------------------------------------------
// 枚举和常量
// ----------------------------------------------------------------------------

/**
 * 文件类型枚举
 */
export type FileType = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'folder' | 'other';

/**
 * MIME类型与文件类型的映射
 */
export const TYPE_MAP: Record<FileType, string> = {
  'image': 'image/',
  'video': 'video/',
  'audio': 'audio/',
  'document': 'application/',
  'archive': 'application/zip',
  'folder': 'folder',
  'other': 'other'
};

/**
 * 文件类型详细映射（MIME类型和扩展名）
 */
export const FILE_TYPE_MAP: Record<FileType, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml', 'text'],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  video: {
    mimeTypes: ['video'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },
  folder: {
    mimeTypes: ['folder'],
    extensions: []
  },
  other: {
    mimeTypes: [],
    extensions: []
  }
};

// ----------------------------------------------------------------------------
// 辅助类型
// ----------------------------------------------------------------------------

/**
 * 文件夹路径项
 */
export interface FolderPath {
  id: string;
  name: string;
}

/**
 * 文件路径项
 * @deprecated 请使用FolderPath
 */
export interface FilePathItem {
  id: string;
  name: string;
}

/**
 * 排序顺序
 */
export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 文件状态
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

// ----------------------------------------------------------------------------
// Context 类型
// ----------------------------------------------------------------------------

/**
 * 文件上下文类型
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
// Hooks 接口
// ----------------------------------------------------------------------------

/**
 * 文件操作Hook接口
 */
export interface FileOperationsHook {
  loading: boolean;
  handleMove: (fileIds: string[], targetFolderId: string) => Promise<void>;
  handleDownload: (fileIds: string[]) => Promise<void>;
  startEditing: (file: File) => void;
  handleRename: () => Promise<void>;
  handleCreateFolder: () => Promise<void>;
  isRenameModalVisible: boolean;
  setIsRenameModalVisible: (visible: boolean) => void;
  editingFile: File | null;
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
 * 注意：此处的File类型是DOM的File类型，不是本模块的File类型
 */
export interface FileUploadHook {
  isUploading: boolean;
  uploadProgress: number;
  handleUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
  handleFolderUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
}

// ----------------------------------------------------------------------------
// 搜索视图组件属性
// ----------------------------------------------------------------------------

/**
 * 搜索视图组件属性
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