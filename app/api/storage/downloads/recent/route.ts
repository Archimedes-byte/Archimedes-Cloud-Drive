/**
 * 最近下载记录API路由
 * 获取用户最近下载的文件
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
 * 获取最近下载的文件
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }
    
    // 获取最近下载的文件
    const recentDownloads = await prisma.downloadHistory.findMany({
      where: {
        userId: (session.user as any).id
      },
      orderBy: {
        downloadedAt: 'desc'
      },
      take: 10,
      include: {
        file: true
      }
    });
    
    // 获取完整的文件信息
    const fileIds = recentDownloads
      .filter(download => download.fileId) // 过滤无效记录
      .map(download => download.fileId);
      
    // 查询文件详细信息
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        isDeleted: false
      }
    });
    
    // 格式化文件数据
    const formattedFiles = files.map(file => formatFile(file));
    
    // 返回成功响应
    return createSuccessResponse({ files: formattedFiles });
  } catch (error) {
    return handleApiError(error, '获取最近下载的文件失败');
  }
} 