import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse } from '../interfaces';

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: '未授权访问',
  NOT_FOUND: '资源不存在',
  INTERNAL_ERROR: '服务器内部错误',
  INVALID_REQUEST: '无效的请求参数',
  FORBIDDEN: '无权限执行此操作',
} as const;

export function createApiResponse<T>(
  data?: T,
  success: boolean = true,
  statusCode: number = STATUS_CODES.SUCCESS,
  message?: string
): NextResponse {
  const response: ApiResponse<T> = {
    success,
    code: statusCode,
    message,
    ...(data && { data })
  };

  return NextResponse.json(response, { status: statusCode });
}

export function createErrorResponse(
  error: string | Error,
  statusCode: number = STATUS_CODES.INTERNAL_ERROR
): NextResponse {
  const message = error instanceof Error ? error.message : error;
  
  return createApiResponse(
    undefined,
    false,
    statusCode,
    message
  );
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = STATUS_CODES.SUCCESS
): NextResponse {
  return createApiResponse(data, true, statusCode, message);
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  const paginatedData: PaginatedResponse<T> = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
  
  return createSuccessResponse(paginatedData);
} 