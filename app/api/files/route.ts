import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

// 根据MIME类型和扩展名确定文件分类
function getFileCategory(mimeType: string, extension: string): string {
  // 图片类型
  if (mimeType.startsWith('image')) {
    return 'image';
  }
  
  // 视频类型
  if (mimeType.startsWith('video')) {
    return 'video';
  }
  
  // 音频类型
  if (mimeType.startsWith('audio')) {
    return 'audio';
  }
  
  // 文档类型
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    mimeType.startsWith('application/vnd.ms-excel') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
    mimeType.startsWith('application/vnd.ms-powerpoint') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml') ||
    mimeType.startsWith('text')
  ) {
    return 'document';
  }
  
  // 压缩文件类型
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip' ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension.toLowerCase())
  ) {
    return 'archive';
  }
  
  // 默认为其他类型
  return 'other';
}

// 获取文件列表
export async function GET(request: NextRequest) {
  console.warn('API路径/api/files已弃用，请使用/api/storage/files');
  
  // 构建新请求URL
  const url = new URL(request.url);
  const newUrl = new URL('/api/storage/files', url.origin);
  
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
      'X-Deprecated': 'This API path is deprecated. Please use /api/storage/files',
    },
  });
}

// 上传文件
export async function POST(request: NextRequest) {
  console.warn('API路径/api/files已弃用，请使用/api/storage/files');
  
  // 构建新请求URL
  const url = new URL(request.url);
  const newUrl = new URL('/api/storage/files', url.origin);
  
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
      'X-Deprecated': 'This API path is deprecated. Please use /api/storage/files',
    },
  });
} 