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
import { FileManagementService } from '@/app/services/storage';
import { FileInfo } from '@/app/types';

const managementService = new FileManagementService();

/**
 * 搜索文件
 */
export const GET = withAuth<FileInfo[]>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    
    // 必需参数: 搜索关键词
    const query = searchParams.get('query');
    if (!query || !query.trim()) {
      return createApiErrorResponse('搜索关键词不能为空', 400);
    }
    
    // 可选参数: 搜索模式(默认为名称搜索)
    const searchMode = searchParams.get('searchMode') === 'tag' ? 'tag' : 'name';
    
    // 可选参数: 文件类型过滤
    const type = searchParams.get('type');
    
    // 可选参数: 是否包含文件夹(默认包含)
    const includeFolder = searchParams.get('includeFolder') !== 'false';
    
    // 可选参数: 标签过滤
    let tags: string[] | undefined;
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      try {
        const parsedTags = JSON.parse(tagsParam);
        if (Array.isArray(parsedTags)) {
          tags = parsedTags.filter(tag => tag && typeof tag === 'string');
        }
      } catch (e) {
        console.error('解析标签参数失败:', e);
      }
    }
    
    // 记录搜索请求
    console.log('搜索请求:', {
      userId: req.user.id,
      query: query.trim(),
      searchMode,
      type: type || '(全部)',
      includeFolder,
      tags: tags || '(无)'
    });
    
    // 执行搜索
    const searchResults = await managementService.searchFiles(
      req.user.id, 
      query.trim(), 
      type, 
      tags, 
      includeFolder,
      searchMode as 'name' | 'tag'
    );
    
    // 返回结果
    return createApiResponse(searchResults);
  } catch (error: any) {
    console.error('搜索API处理失败:', error);
    return createApiErrorResponse(error.message || '搜索文件失败', 500);
  }
}); 