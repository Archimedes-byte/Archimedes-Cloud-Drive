import { NextResponse } from 'next/server';

/**
 * 处理API错误并返回统一格式的响应
 * 
 * @param error 错误对象
 * @param message 错误消息前缀
 * @param status HTTP状态码，默认为500
 * @returns 格式化的NextResponse错误响应
 */
export function handleApiError(error: any, message: string, status: number = 500) {
  console.error(`${message}:`, error);
  
  return NextResponse.json(
    { 
      success: false, 
      error: `${message}: ${error.message || '未知错误'}` 
    },
    { status }
  );
}

/**
 * 处理API未授权错误
 * 
 * @param message 错误消息
 * @returns 格式化的NextResponse未授权错误响应
 */
export function handleUnauthorized(message: string = '未授权访问') {
  console.log(`API: ${message}`);
  
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * 处理API资源不存在错误
 * 
 * @param message 错误消息
 * @returns 格式化的NextResponse资源不存在错误响应
 */
export function handleNotFound(message: string = '资源不存在') {
  console.log(`API: ${message}`);
  
  return NextResponse.json(
    { success: false, error: message },
    { status: 404 }
  );
} 