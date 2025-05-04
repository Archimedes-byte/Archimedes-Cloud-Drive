import { NextResponse } from 'next/server';
import { UserProfile } from '@/app/types/user';

/**
 * 创建成功的API响应
 * 
 * @param data 响应数据
 * @returns 格式化的NextResponse成功响应
 */
export function createSuccessResponse<T>(data: T) {
  return NextResponse.json({
    success: true,
    ...typeof data === 'object' ? data : { data }
  });
} 