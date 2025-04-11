import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// API响应状态码
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// 错误消息常量
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '未授权访问',
  NOT_FOUND: '资源不存在',
  INTERNAL_ERROR: '服务器内部错误',
  INVALID_REQUEST: '无效的请求参数',
  FORBIDDEN: '无权限执行此操作',
  VALIDATION_ERROR: '数据验证失败',
  RESOURCE_EXISTS: '资源已存在',
  SERVICE_UNAVAILABLE: '服务暂时不可用',
};

// 错误码常量
export const ERROR_CODES = {
  UNAUTHORIZED: 'AUTH_ERROR',
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'PERMISSION_DENIED',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: number;
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 成功消息
 * @param statusCode HTTP状态码
 * @returns NextResponse实例
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = STATUS_CODES.SUCCESS
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    message,
    timestamp: Date.now(),
    ...(data !== undefined && { data }),
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * 创建错误响应
 * @param error 错误信息
 * @param statusCode HTTP状态码
 * @param errorCode 错误代码
 * @param validationErrors 验证错误信息
 * @returns NextResponse实例
 */
export function createErrorResponse(
  error: string | Error,
  statusCode: number = STATUS_CODES.INTERNAL_ERROR,
  errorCode?: string,
  validationErrors?: Record<string, string[]>
): NextResponse {
  // 处理ZodError
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    
    // 将Zod验证错误转换为字段错误映射
    error.errors.forEach((err) => {
      const field = err.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(err.message);
    });
    
    const response: ApiResponse = {
      success: false,
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      code: ERROR_CODES.VALIDATION_ERROR,
      errors,
      timestamp: Date.now(),
    };
    
    return NextResponse.json(response, { status: STATUS_CODES.UNPROCESSABLE_ENTITY });
  }
  
  // 处理其他类型的错误
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: Date.now(),
    ...(validationErrors && { errors: validationErrors }),
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * 创建带分页的成功响应
 * @param items 分页项目
 * @param total 总记录数
 * @param page 当前页码
 * @param pageSize 每页大小
 * @param message 成功消息
 * @returns NextResponse实例
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): NextResponse {
  const paginatedData: PaginatedResponse<T> = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
  
  return createSuccessResponse(paginatedData, message);
}

/**
 * 创建无内容响应
 * @returns NextResponse实例
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: STATUS_CODES.NO_CONTENT });
}

/**
 * API异常捕获处理器
 * @param callback API处理函数
 * @returns 处理后的API响应
 */
export function apiHandler<T>(
  callback: () => Promise<NextResponse<T>>
): Promise<NextResponse> {
  return callback().catch((error) => {
    console.error('API错误:', error);
    
    if (error instanceof ZodError) {
      return createErrorResponse(error);
    }
    
    if (error instanceof Error) {
      // 可以在这里添加错误分类处理逻辑
      return createErrorResponse(
        error.message,
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
    
    return createErrorResponse(
      '未知错误',
      STATUS_CODES.INTERNAL_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  });
} 