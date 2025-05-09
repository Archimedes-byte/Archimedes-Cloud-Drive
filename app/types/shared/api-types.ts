/**
 * 统一API类型定义
 * 
 * 这个文件集中定义和整合所有API相关类型，消除重复定义
 * 采用层次结构设计，通过接口继承实现类型复用和扩展
 */

// ======= 基础响应接口 =======

/**
 * 响应状态接口 - 所有API响应的基础
 */
export interface ResponseStatus {
  /** 请求是否成功 */
  success: boolean;
  /** 可选的消息说明 */
  message?: string;
  /** 状态或错误码 */
  code?: string | number;
}

/**
 * 基础API响应接口 - 通用API响应结构
 */
export interface ApiResponse<T = any> extends ResponseStatus {
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** HTTP状态码 */
  statusCode?: number;
}

// ======= 错误处理接口 =======

/**
 * 统一错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: number | string;
  message?: string;
  details?: Record<string, any>;
}

/**
 * API错误类
 */
export class ApiError extends Error {
  code: number | string;
  message: string;
  details?: Record<string, any>;

  constructor(message: string, code: number | string = 'UNKNOWN_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.message = message;
    this.details = details;
  }
}

// ======= 特定领域响应接口 =======

/**
 * 认证响应接口 - 用于登录/注册等认证操作
 */
export interface AuthResponse extends ApiResponse {
  data?: {
    user: UserBasic;
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
}

/**
 * 带分页的API响应接口
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse extends ApiResponse {
  file?: {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
  };
}

/**
 * 文件操作响应接口
 */
export interface FileOperationResponse extends ApiResponse {
  fileId?: string;
  message?: string;
}

// ======= 用户相关接口 =======

/**
 * 用户基本信息接口 - 用于基础显示和身份验证
 */
export interface UserBasic {
  /** 用户ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 用户名 */
  name: string | null;
  /** 头像URL */
  avatarUrl?: string | null;
}

/**
 * 用户资料接口 - 包含完整用户信息
 */
export interface UserProfile extends UserBasic {
  /** 主题 */
  theme?: string | null;
  /** 账户类型 */
  accountType?: 'free' | 'premium' | 'enterprise';
  /** 用户角色 */
  role?: string | null;
  /** 已使用存储空间（字节） */
  storageUsed: number;
  /** 存储空间限制（字节） */
  storageLimit: number;
  /** 用户简介 */
  bio?: string | null;
  /** 位置 */
  location?: string | null;
  /** 网站 */
  website?: string | null;
  /** 公司 */
  company?: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 用户资料更新输入
 */
export interface UserProfileInput {
  /** 显示名称 */
  name?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 主题 */
  theme?: string;
  /** 用户简介 */
  bio?: string;
  /** 位置 */
  location?: string;
  /** 网站 */
  website?: string;
  /** 公司 */
  company?: string;
}

// ======= 认证相关接口 =======

/**
 * 登录凭据
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 注册数据
 */
export interface RegisterData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * 密码校验结果
 */
export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * NextAuth JWT扩展
 */
export interface AuthJWT {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  accessToken?: string;
  iat?: number;
  exp?: number;
  jti?: string;
} 