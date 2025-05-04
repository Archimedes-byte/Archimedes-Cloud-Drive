/**
 * 类型定义统一导出
 * 
 * 本文件导出所有应用中使用的类型定义，集中在一个地方管理
 * 类型按照功能领域和用途进行分类，便于维护和查找
 */

// 导出核心/通用类型
export * from './core/common';

// 选择性导出核心API类型，避免与api目录冲突
export type { 
  ApiResponse,
  ApiError,
  ResponseStatus,
  ErrorResponse,
  AppConfig
} from './core/api';

// 导出文件相关类型
// 注意：从多个模块导出同名类型会产生冲突，以下是解决方案
export type { 
  FileSystemItemBase, FileBase, FolderBase,
  FileSortEnum,
  // 导出FolderPathItem作为推荐的文件路径类型
  FolderPathItem,
  // 导出FileInfo用于API请求和简化场景
  FileInfo,
  // 导出排序相关类型
  FileSortInterface, SortField, FileSortOptions
} from './domains/fileTypes';

// 导出排序转换工具函数和枚举
export { 
  convertInterfaceToSortOrder, 
  convertSortOrderToInterface,
  SortDirectionEnum,
  FileTypeEnum,
  // 导出新的文件类型映射
  FILE_TYPE_MAP,
  // 导出文件实体映射函数
  mapFileEntityToFileInfo
} from './domains/fileTypes';

// 导出File类型别名以保持兼容性，使用FileInfo代替
export type { 
  FileInfo as File, 
  // 导出数据库实体类型
  FileEntity,
  // 导出API响应类型
  FileResponse,
  // 导出创建文件夹请求类型
  CreateFolderRequest
} from './domains/fileTypes';
export type { SortOrder } from './domains/fileTypes';

// 导出UI相关类型
export * from './ui';

// 导出API相关类型
export * from './api';

// 导出进行重命名以避免冲突的类型
export type { 
  // UI相关，避免与./ui冲突
  FileListProps as DomainFileListProps,
  RenameModalProps as DomainRenameModalProps,
  SearchViewProps as DomainSearchViewProps,
  UploadModalProps as DomainUploadModalProps,
  // 导出FileContextType及相关类型
  FileContextType,
  FileState,
  ExtendedFile
} from './domains/file-management';

// 导出Hook相关类型 - 从新位置导出以避免冲突
export * from './hooks';

// 导出工具类型
export * from './utils';

// 导出全局类型扩展
// 注意：.d.ts文件通常不需要显式导出，它们在全局范围内自动生效
// export * from './global/next-auth';
// export * from './global/declarations';

// 解决其他导出歧义
export type { PaginatedResponse } from './core/common';
export type { FileUploadHook, FileSearchHook, FileOperationsHook } from './hooks/hooks';

// 导出认证相关类型，明确指定类型导出以避免冲突
export type {
  UserBasic,
  UserFull,
  LoginCredentials,
  RegisterData,
  AuthError,
  ApiResponse as AuthApiResponse,
  PasswordValidationResult,
  EmailValidationResult,
  CredentialsValidationResult,
  PasswordRequirements,
  AuthJWT
} from './auth';

// 从常量导出错误码
export { AUTH_ERROR_CODE } from '@/app/constants/auth'; 