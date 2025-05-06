/**
 * 文件访问历史API路由
 * 获取特定文件的访问历史记录
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 解析URL获取文件ID
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const fileId = pathSegments[pathSegments.indexOf('files') + 1];
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 解析查询参数
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // 验证文件存在和所有权
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        uploaderId: req.user.id,
        isDeleted: false
      }
    });
    
    if (!file) {
      return createApiErrorResponse('文件不存在或无访问权限', 404);
    }
    
    // 获取访问历史记录总数
    const total = await prisma.fileAccess.count({
      where: { fileId }
    });
    
    // 获取分页的访问历史记录
    const accessHistory = await prisma.fileAccess.findMany({
      where: { fileId },
      orderBy: { accessedAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // 处理返回的结果
    const formattedHistory = accessHistory.map(record => ({
      id: record.id,
      userId: record.userId,
      userName: record.user.name || '未知用户',
      userEmail: record.user.email,
      accessedAt: record.accessedAt
    }));
    
    // 返回带分页信息的结果
    return createApiResponse({
      history: formattedHistory,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('获取文件访问历史失败:', error);
    return createApiErrorResponse(error.message || '获取文件访问历史失败', 500);
  }
}); 