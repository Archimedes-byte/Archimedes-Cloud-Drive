/**
 * 类型定义统一导出
 * 
 * 本文件导出所有应用中使用的类型定义，集中在一个地方管理
 * 类型按照功能领域和用途进行分类，便于维护和查找
 */

// 从共享API类型导入基础用户类型
import { UserBasic } from './shared/api-types';

// 从共享类型中导入，但不直接导出，避免命名冲突
import * as SharedTypes from './shared';

// 显式导出共享类型中的用户相关类型
export type {
  UserBasic,
  UserProfile,
  UserProfileInput,
  LoginCredentials,
  RegisterData,
  PasswordValidationResult,
  AuthJWT,
  ApiResponse,
  ResponseStatus,
  ErrorResponse,
  AuthResponse,
  PaginatedResponse,
  FileUploadResponse,
  FileOperationResponse
} from './shared/api-types';

// 导出共享类型命名空间，用户可以通过SharedTypes.ApiResponse这样的方式访问
export { SharedTypes };

// 导出核心/通用类型
export * from './core/common';

// 导出文件相关类型
export type { 
  FileSystemItemBase, FileBase, FolderBase,
  FileSortEnum,
  FolderPathItem,
  FileInfo,
  FileSortInterface, SortField, FileSortOptions
} from './domains/fileTypes';

// 导出排序转换工具函数和枚举
export { 
  convertInterfaceToSortOrder, 
  convertSortOrderToInterface,
  SortDirectionEnum,
  FileTypeEnum,
  FileType,
  FILE_TYPE_MAP,
  mapFileEntityToFileInfo
} from './domains/fileTypes';

// 导出File类型别名以保持兼容性
export type { 
  FileInfo as File, 
  FileEntity,
  FileResponse,
  CreateFolderRequest
} from './domains/fileTypes';

// 导出UI相关类型
export * from './ui';

// 导出API相关类型
export * from './api';

// 导出文件API的请求类型
export type { 
  SearchFilesRequest as FileSearchRequest, 
  UploadFileRequest, 
  RenameFileRequest,
  MoveFileRequest,
  BulkMoveRequest,
  DeleteFileRequest,
  BulkDeleteRequest,
  RestoreFileRequest,
  BulkRestoreRequest,
  UpdateTagsRequest,
  BulkUpdateTagsRequest
} from './api/requests';

// 文件列表请求参数（从file-api中迁移）
export interface FileListRequest {
  folderId?: string | null;
  type?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  recursive?: boolean;
  signal?: AbortSignal;
  _t?: number;
}

// 导出进行重命名以避免冲突的类型
export type { 
  FileListProps as DomainFileListProps,
  RenameModalProps as DomainRenameModalProps,
  SearchViewProps as DomainSearchViewProps,
  UploadModalProps as DomainUploadModalProps,
  FileState,
  ExtendedFile
} from './domains/file-management';

// 导出Hook相关类型
export * from './hooks';

// 导出工具类型
export * from './utils';

// 导出Hook相关类型
export type { FileUploadHook, FileSearchHook, FileOperationsHook } from './hooks/hooks';

// 为了向后兼容，保持旧版导出路径的类型别名
export type { 
  UserBasic as DomainUserBasic,
  UserProfile as DomainUserProfile,
  UserProfileInput as DomainUserProfileInput
} from './domains/user-profile';

// 认证相关类型 - 不再从domains/auth导入，改为导出需要的接口定义
export interface UserFull extends UserBasic {
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthError {
  message: string;
  code: any; // 使用any替代AUTH_ERROR_CODE，避免循环导入
  status?: number;
  originalError?: Error;
}

export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

export interface CredentialsValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordRequirements {
  minLength: number;
  requireNumbers: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireSpecialChars: boolean;
}

// 从常量导出错误码
export { AUTH_ERROR_CODE } from '@/app/constants/auth'; 