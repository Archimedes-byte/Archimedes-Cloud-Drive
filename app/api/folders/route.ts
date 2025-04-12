/**
 * @deprecated 此API路径已弃用，请使用 /api/storage/folders
 * 文件夹API路由（旧）- 转发到新路径
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * 转发旧路径GET请求到新路径
 */
export async function GET(request: NextRequest) {
  console.warn('API路径/api/folders已弃用，请使用/api/storage/folders');
  
  // 构建新请求URL
  const url = new URL(request.url);
  const newUrl = new URL('/api/storage/folders', url.origin);
  
  // 保留所有查询参数
  for (const [key, value] of url.searchParams.entries()) {
    newUrl.searchParams.append(key, value);
  }
  
  // 转发到新API端点
  const response = await fetch(newUrl, {
    method: 'GET',
    headers: request.headers,
  });
  
  // 添加弃用警告头
  const responseData = await response.json();
  
  return NextResponse.json(responseData, {
    status: response.status,
    headers: {
      'X-Deprecated': 'This API path is deprecated. Please use /api/storage/folders',
    },
  });
}

/**
 * 转发旧路径POST请求到新路径
 */
export async function POST(request: NextRequest) {
  console.warn('API路径/api/folders已弃用，请使用/api/storage/folders');
  
  // 构建新请求URL
  const url = new URL(request.url);
  const newUrl = new URL('/api/storage/folders', url.origin);
  
  // 转发到新API端点
  const response = await fetch(newUrl, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });
  
  // 添加弃用警告头
  const responseData = await response.json();
  
  return NextResponse.json(responseData, {
    status: response.status,
    headers: {
      'X-Deprecated': 'This API path is deprecated. Please use /api/storage/folders',
    },
  });
} 