/**
 * 最近文件API路由
 * 获取用户最近访问的文件
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/app/utils/api/error-handler';
import { createSuccessResponse } from '@/app/utils/api/response-builder';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { ApiResponse } from '@/app/types/shared/api-types';
import { formatFile } from '@/app/utils/file';

/**
 * 获取最近访问的文件
 */
export async function GET(request: NextRequest) {
  // 使用ApiResponse<T>替代自定义接口
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }
    
    // 解析查询参数
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // 使用FileAccess模型记录用户最近访问的文件
    const recentAccesses = await prisma.fileAccess.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        accessedAt: 'desc'
      },
      take: limit,
      include: {
        file: true
      }
    });
    
    // 提取文件ID并过滤重复项（保留最近访问的）
    const processedFileIds = new Set<string>();
    const fileIds: string[] = [];
    
    recentAccesses.forEach(access => {
      if (access.fileId && !processedFileIds.has(access.fileId)) {
        processedFileIds.add(access.fileId);
        fileIds.push(access.fileId);
      }
    });
      
    // 查询文件详细信息
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        isDeleted: false
      }
    });
    
    // 格式化文件数据并保持排序顺序
    const fileMap = new Map(files.map(file => [file.id, file]));
    const formattedFiles = fileIds
      .map(id => fileMap.get(id))
      .filter(Boolean)
      .map(file => formatFile(file));
    
    // 返回成功响应
    return createSuccessResponse({ files: formattedFiles });
  } catch (error) {
    return handleApiError(error, '获取最近访问的文件失败');
  }
} 