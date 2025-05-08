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
import { ApiResponse } from '@/app/types';
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
      take: 20, // 增加返回数量以确保显示更多记录
      include: {
        file: true
      }
    });
    
    // 过滤有效记录（文件仍然存在且未删除）
    const validDownloads = recentDownloads.filter(
      download => download.file && !download.file.isDeleted
    );
    
    // 转换为前端需要的格式
    const formattedDownloads = validDownloads.map(download => {
      const fileInfo = formatFile(download.file);
      
      // 添加下载时间
      return {
        ...fileInfo,
        downloadedAt: download.downloadedAt.toISOString()
      };
    });
    
    // 返回成功响应
    return createSuccessResponse({ files: formattedDownloads });
  } catch (error) {
    return handleApiError(error, '获取最近下载的文件失败');
  }
} 