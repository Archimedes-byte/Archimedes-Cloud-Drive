/**
 * 文件夹API路由
 * 处理文件夹相关请求
 * 
 * 注意：
 * - 此API专门处理文件夹，仅返回isFolder=true的项目
 * - 通用文件查询请使用 GET /api/storage/files
 * 
 * 该API提供两个主要功能:
 * 1. 获取文件夹列表(GET) - 仅返回文件夹，不包含普通文件
 * 2. 创建新文件夹(POST) - 专门用于创建文件夹结构
 * 
 * 文件夹创建是系统的核心功能之一，它允许用户:
 * - 组织文件结构
 * - 创建层级存储体系
 * - 管理文件分类
 * 
 * 与文件上传API的区别:
 * - 文件上传API: 处理二进制文件数据的上传和存储
 * - 文件夹API: 只处理文件夹结构的创建和管理
 */
import { prisma } from '@/app/lib/database';
import { withAuth, AuthenticatedRequest, createApiResponse, createApiErrorResponse } from '@/app/middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

// 创建一个自定义的nanoid实例，使用更安全的字符集
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 20);

// 文件夹名称中不允许包含的字符
const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const MAX_FOLDER_NAME_LENGTH = 255;

/**
 * 获取文件夹列表
 * GET /api/storage/folders
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    
    // 计算分页查询的参数
    const skip = (page - 1) * pageSize;
    
    // 查询条件
    const where = {
      uploaderId: req.user.id,
      isFolder: true,
      isDeleted: false,
      parentId: parentId || null,
    };
    
    // 查询文件夹列表
    const items = await prisma.file.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        name: 'asc'
      }
    });
    
    // 获取总数
    const total = await prisma.file.count({ where });
    
    return createApiResponse({
      items,
      total,
      page,
      pageSize
    });
  } catch (error: any) {
    console.error('获取文件夹列表失败:', error);
    return createApiErrorResponse(error.message || '获取文件夹列表失败', 500);
  }
});

/**
 * 创建文件夹
 * POST /api/storage/folders
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { name, parentId, tags = [] } = await req.json();
    
    // 文件夹名称验证
    if (!name || typeof name !== 'string') {
      return createApiErrorResponse('文件夹名称不能为空', 400);
    }
    
    // 清理文件夹名称中的非法字符
    const cleanName = name.replace(INVALID_CHARS, '').trim();
    
    if (cleanName.length === 0) {
      return createApiErrorResponse('文件夹名称包含无效字符', 400);
    }
    
    if (cleanName.length > MAX_FOLDER_NAME_LENGTH) {
      return createApiErrorResponse(`文件夹名称不能超过${MAX_FOLDER_NAME_LENGTH}个字符`, 400);
    }
    
    // 检查是否存在重名文件夹
    const existingFolder = await prisma.file.findFirst({
      where: {
        name: cleanName,
        parentId: parentId || null,
        uploaderId: req.user.id,
        isFolder: true,
        isDeleted: false
      }
    });
    
    if (existingFolder) {
      return createApiErrorResponse('同一目录下已存在相同名称的文件夹', 409);
    }
    
    // 检查父文件夹是否存在（如果提供了parentId）
    let parentPath = '';
    
    if (parentId) {
      const parentFolder = await prisma.file.findUnique({
        where: {
          id: parentId,
          uploaderId: req.user.id,
          isFolder: true,
          isDeleted: false
        }
      });
      
      if (!parentFolder) {
        return createApiErrorResponse('父文件夹不存在或无权访问', 404);
      }
      
      parentPath = parentFolder.path;
    }
    
    // 生成唯一ID
    const folderId = nanoid();
    
    // 构建文件夹路径
    const folderPath = parentPath 
      ? `${parentPath === '/' ? '' : parentPath}/${folderId}` 
      : `/${folderId}`;
    
    // 验证标签列表
    const validTags = Array.isArray(tags) ? tags : [];
    
    // 创建文件夹
    const folder = await prisma.file.create({
      data: {
        id: folderId,           // 提供唯一ID
        name: cleanName,        // 使用清理后的名称
        parentId,
        isFolder: true,
        uploaderId: req.user.id,
        size: 0,
        type: 'folder',
        filename: cleanName,    // 必须为filename提供值
        path: folderPath,       // 使用处理后的路径
        tags: validTags,        // 存储标签信息
        updatedAt: new Date()   // 提供更新时间
      }
    });
    
    return createApiResponse({
      success: true,
      message: '文件夹创建成功',
      folder
    });
  } catch (error: any) {
    console.error('创建文件夹失败:', error);
    return createApiErrorResponse(error.message || '创建文件夹失败', 500);
  }
}); 