/**
 * 最近文件API路由
 * 获取用户最近访问的文件
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileInfo } from '@/app/types';
import { prisma } from '@/app/lib/database';
import { mapFileEntityToFileInfo } from '@/app/services/storage/file-upload-service';

// 定义API响应类型
interface RecentFilesResponse {
  files: FileInfo[];
}

/**
 * 获取最近文件
 */
export const GET = withAuth<RecentFilesResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // 限制最大获取数量
    const safeLimit = Math.min(limit, 50);
    
    console.log(`[API:recent] 获取最近访问文件, 用户ID: ${req.user.id}, 限制: ${safeLimit}`);
    
    // 直接使用Prisma获取最近文件
    const recentFiles = await prisma.file.findMany({
      where: {
        uploaderId: req.user.id,
        isDeleted: false,
        isFolder: false, // 只包含文件，不包含文件夹
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: safeLimit,
    });
    
    // 转换为FileInfo对象
    const fileInfoList = recentFiles.map(mapFileEntityToFileInfo);
    
    console.log(`[API:recent] 找到 ${fileInfoList.length} 个最近访问文件`);
    
    // 返回数据
    return createApiResponse({ files: fileInfoList });
  } catch (error: any) {
    console.error('[API:recent] 获取最近文件失败:', error);
    return createApiErrorResponse(error.message || '获取最近文件失败', 500);
  }
}); 