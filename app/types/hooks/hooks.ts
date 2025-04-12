/**
 * Hooks类型定义
 * 
 * 本文件包含所有Hooks相关的类型定义，按功能分类
 */

import { FileWithUIState } from '../domains/fileTypes';

/**
 * 基础Hook状态接口
 * 共享的状态属性
 */
export interface BaseHookState {
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 模态框Hook状态接口
 * 用于管理模态框状态的Hook
 */
export interface ModalHookState {
  /** 模态框是否可见 */
  isVisible: boolean;
  /** 设置模态框可见状态 */
  setVisible: (visible: boolean) => void;
  /** 打开模态框 */
  open: () => void;
  /** 关闭模态框 */
  close: () => void;
}

/**
 * 文件操作基础Hook接口
 * 共享的文件操作方法
 */
export interface FileOperationsBaseHook extends BaseHookState {
  /** 选择文件 */
  selectFile: (fileId: string, selected: boolean) => void;
  /** 选择多个文件 */
  selectFiles: (fileIds: string[]) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 获取选中的文件IDs */
  selectedFileIds: string[];
}

/**
 * 文件操作Hook接口
 */
export interface FileOperationsHook extends FileOperationsBaseHook {
  /** 移动文件 */
  handleMove: (fileIds: string[], targetFolderId: string) => Promise<void>;
  /** 下载文件 */
  handleDownload: (fileIds: string[]) => Promise<void>;
  /** 开始编辑文件 */
  startEditing: (file: FileWithUIState) => void;
  /** 重命名文件 */
  handleRename: () => Promise<void>;
  /** 创建文件夹 */
  handleCreateFolder: () => Promise<void>;
  /** 重命名模态框状态 */
  isRenameModalVisible: boolean;
  /** 设置重命名模态框状态 */
  setIsRenameModalVisible: (visible: boolean) => void;
  /** 正在编辑的文件 */
  editingFile: FileWithUIState | null;
  /** 新文件名 */
  newFileName: string;
  /** 设置新文件名 */
  setNewFileName: (name: string) => void;
  /** 新扩展名 */
  newExtension: string;
  /** 设置新扩展名 */
  setNewExtension: (ext: string) => void;
  /** 创建文件夹模态框状态 */
  isCreateFolderModalVisible: boolean;
  /** 设置创建文件夹模态框状态 */
  setIsCreateFolderModalVisible: (visible: boolean) => void;
  /** 新文件夹名称 */
  newFolderName: string;
  /** 设置新文件夹名称 */
  setNewFolderName: (name: string) => void;
  /** 新文件夹标签 */
  newFolderTags: string;
  /** 设置新文件夹标签 */
  setNewFolderTags: (tags: string) => void;
}

/**
 * 文件搜索Hook接口
 */
export interface FileSearchHook extends BaseHookState {
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 搜索错误 */
  searchError: string | null;
  /** 搜索结果 */
  searchResults: FileWithUIState[];
  /** 执行搜索 */
  handleSearch: (query: string, fileType: string | null) => Promise<void>;
  /** 清除搜索 */
  clearSearch: () => void;
}

/**
 * 文件上传Hook接口
 */
export interface FileUploadHook extends BaseHookState {
  /** 是否正在上传 */
  isUploading: boolean;
  /** 上传进度 */
  uploadProgress: number;
  /** 上传文件 */
  handleUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
  /** 上传文件夹 */
  handleFolderUpload: (files: File[], tags?: string[], folderId?: string | null) => Promise<void>;
  /** 取消上传 */
  cancelUpload?: () => void;
} 