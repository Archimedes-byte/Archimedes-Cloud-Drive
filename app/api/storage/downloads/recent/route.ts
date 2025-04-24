/**
 * 最近下载记录API路由
 * 获取用户最近下载的文件
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';
import { FileInfo, mapFileEntityToFileInfo } from '@/app/types';

/**
 * 获取最近下载文件
 */
export const GET = withAuth<FileInfo[]>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // 限制最大获取数量
    const safeLimit = Math.min(limit, 50);
    
    // 获取最近下载文件
    const downloadHistories = await prisma.downloadHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { downloadedAt: 'desc' },
      take: safeLimit,
      include: { file: true }
    });
    
    // 转换为文件信息
    const recentDownloads = downloadHistories
      .filter(history => !history.file.isDeleted) // 过滤已删除的文件
      .map(history => ({
        ...mapFileEntityToFileInfo(history.file),
        downloadedAt: history.downloadedAt
      }));
    
    return createApiResponse(recentDownloads);
  } catch (error: any) {
    console.error('获取最近下载文件失败:', error);
    return createApiErrorResponse(error.message || '获取最近下载文件失败', 500);
  }
}); 