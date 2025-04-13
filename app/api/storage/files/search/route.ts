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
import { prisma } from '@/app/lib/database';

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
    
    // 使用改进的搜索逻辑 (从旧API移植)
    
    // 构建基础查询条件
    const baseWhere = {
      uploaderId: req.user.id,
      isDeleted: false,
    };
    
    let files = [];
    
    // 根据搜索类型执行不同查询
    if (type === 'tag') {
      // 标签搜索 - 精确匹配
      console.log(`执行标签搜索，标签: ${query}`);
      
      files = await prisma.file.findMany({
        where: {
          ...baseWhere,
          tags: {
            hasSome: [query.trim()]
          }
        },
        orderBy: [
          { isFolder: 'desc' }, // 文件夹优先
          { createdAt: 'desc' }
        ]
      });
      
      console.log(`标签搜索结果数量: ${files.length}`);
      
      // 如果精确标签搜索没有结果，尝试进行模糊标签搜索
      if (files.length === 0) {
        console.log('尝试进行模糊标签搜索');
        
        // 获取所有文件的所有标签
        const allFiles = await prisma.file.findMany({
          where: baseWhere,
          select: {
            id: true,
            tags: true
          }
        });
        
        // 将标签转为小写进行模糊匹配
        const searchTerm = query.trim().toLowerCase();
        
        // 找到标签部分匹配的文件ID
        const matchedFileIds = allFiles
          .filter(file => 
            Array.isArray(file.tags) && 
            file.tags.some(tag => 
              tag.toLowerCase().includes(searchTerm)
            )
          )
          .map(file => file.id);
        
        console.log(`模糊标签匹配找到 ${matchedFileIds.length} 个文件`);
        
        // 如果有匹配的文件ID，查询完整文件信息
        if (matchedFileIds.length > 0) {
          files = await prisma.file.findMany({
            where: {
              id: { in: matchedFileIds }
            },
            orderBy: [
              { isFolder: 'desc' },
              { createdAt: 'desc' }
            ]
          });
          
          console.log(`模糊标签搜索结果数量: ${files.length}`);
        }
      }
    } else {
      // 文件名搜索
      console.log(`执行文件名搜索，关键词: ${query}`);
      
      files = await prisma.file.findMany({
        where: {
          ...baseWhere,
          name: {
            contains: query,
            mode: 'insensitive', // 不区分大小写
          }
        },
        orderBy: [
          { isFolder: 'desc' }, // 文件夹优先
          { createdAt: 'desc' }
        ]
      });
      
      console.log(`文件名搜索结果数量: ${files.length}`);
    }
    
    // 收集所有需要查询的父文件ID
    const parentIds = files
      .filter(file => file.parentId)
      .map(file => file.parentId as string);
    
    // 如果有父文件ID，查询这些父文件信息
    const parentMap = new Map();
    if (parentIds.length > 0) {
      const parentFiles = await prisma.file.findMany({
        where: {
          id: { in: parentIds }
        },
        select: {
          id: true,
          name: true,
          path: true
        }
      });
      
      // 构建ID到父文件信息的映射
      for (const parent of parentFiles) {
        parentMap.set(parent.id, parent);
      }
    }
    
    // 增强处理父文件夹路径
    const processedFiles = files.map(file => {
      let pathInfo = '/';
      
      // 如果文件有父级，从parentMap中获取父级信息
      if (file.parentId && parentMap.has(file.parentId)) {
        const parent = parentMap.get(file.parentId);
        pathInfo = parent.path || parent.name || '/';
        
        // 确保路径格式一致，以/开头
        if (pathInfo !== '/' && !pathInfo.startsWith('/')) {
          pathInfo = `/${pathInfo}`;
        }
      }
      
      // 格式化文件信息
      return {
        id: file.id,
        name: file.name,
        type: file.type || '',
        size: file.size || 0,
        url: file.url || '',
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        parentId: file.parentId,
        tags: file.tags || [],
        isFolder: file.isFolder,
        path: pathInfo, // 使用处理后的路径
      };
    });
    
    // 记录结果统计信息
    const folderCount = processedFiles.filter(f => f.isFolder).length;
    const fileCount = processedFiles.length - folderCount;
    console.log(`搜索结果: 共${processedFiles.length}个项目，其中文件夹${folderCount}个，文件${fileCount}个`);
    
    return createApiResponse(processedFiles);
  } catch (error: any) {
    console.error('搜索文件失败:', error);
    return createApiErrorResponse(error.message || '搜索文件失败', 500);
  }
}); 