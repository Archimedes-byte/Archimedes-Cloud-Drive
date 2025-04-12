/**
 * 文件搜索API路由
 * 处理文件搜索请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { FileInfo } from '@/app/types';

const storageService = new StorageService();

/**
 * 搜索文件
 */
export const GET = withAuth<FileInfo[]>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type');
    
    // 处理标签参数
    let tags: string[] | undefined;
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      try {
        tags = JSON.parse(tagsParam);
        if (!Array.isArray(tags)) {
          tags = undefined;
        }
      } catch (e) {
        console.error('解析标签参数失败:', e);
      }
    }
    
    // 验证必须参数
    if (!query) {
      return createApiErrorResponse('搜索关键词不能为空', 400);
    }
    
    // 执行搜索
    const results = await storageService.searchFiles(
      req.user.id,
      query,
      type,
      tags
    );
    
    return createApiResponse(results);
  } catch (error: any) {
    console.error('搜索文件失败:', error);
    return createApiErrorResponse(error.message || '搜索文件失败', 500);
  }
}); 