/**
 * 核心通用类型定义
 * 
 * 包含应用中共享的基础类型定义，如分页、排序等
 */

/**
 * 分页请求参数接口
 * 用于向API发送分页请求
 */
export interface PaginationParams {
  /** 当前页码，从1开始 */
  page: number;
  /** 每页项目数量 */
  limit: number;
}

/**
 * 分页响应元数据接口
 * 包含分页相关的元数据信息
 */
export interface PaginationMeta {
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 总项目数 */
  totalItems: number;
  /** 每页项目数 */
  itemsPerPage: number;
}

/**
 * 核心分页响应接口
 * API返回的分页数据格式
 * @template T 分页数据项的类型
 * @deprecated 请使用 PaginatedResponse 代替，在 @/app/types/shared/api-types.ts 中定义
 */
export interface CorePaginatedResponse<T> {
  /** 数据项数组 */
  data: T[];
  /** 分页元数据 */
  meta: PaginationMeta;
}

/**
 * 排序方向枚举
 * 替代字符串联合类型，提高类型安全性
 */
export enum SortDirection {
  /** 升序 */
  ASC = 'asc',
  /** 降序 */
  DESC = 'desc'
}

/**
 * 排序参数接口
 * 用于指定排序字段和方向
 */
export interface SortParams {
  /** 排序字段名称 */
  field: string;
  /** 排序方向 */
  direction: SortDirection;
}

/**
 * ID参数接口
 * 用于包含ID的请求参数
 */
export interface IdParam {
  /** 资源标识符 */
  id: string;
}

/**
 * 错误代码枚举
 * 系统中所有可能的错误类型
 */
export enum ErrorCode {
  /** 未授权访问 */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** 资源未找到 */
  NOT_FOUND = 'NOT_FOUND',
  /** 数据验证错误 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 服务器内部错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 存储空间超出限制 */
  STORAGE_LIMIT_EXCEEDED = 'STORAGE_LIMIT_EXCEEDED',
  /** 文件过大 */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** 不支持的文件类型 */
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
}

/**
 * 通用键值对接口
 * 用于存储键值对数据，支持泛型类型
 * @template T 值的类型，默认为unknown而非any
 */
export interface KeyValuePair<T = unknown> {
  /** 键名 */
  key: string;
  /** 键值 */
  value: T;
}

/**
 * 统一时间类型
 * 处理日期时间的统一类型，可以是ISO字符串或Date对象
 */
export type TimeValue = string | Date;

/**
 * 基础实体接口
 * 所有实体类型的基础接口，包含通用字段
 */
export interface BaseEntity {
  /** 唯一标识符 */
  id: string;
  /** 创建时间 */
  createdAt: TimeValue;
  /** 更新时间 */
  updatedAt: TimeValue;
} 