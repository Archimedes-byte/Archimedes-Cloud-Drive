/**
 * 文件内容API路由
 * 获取文件原始内容，适用于文本文件编辑等场景
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileManagementService } from '@/app/services/storage';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { FILE_CATEGORIES } from '@/app/utils/file/type';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const fileManagementService = new FileManagementService();
const prisma = new PrismaClient();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 判断文件是否为文本类型
 */
function isTextFile(fileType: string, extension: string): boolean {
  const textExtensions = [
    'txt', 'md', 'markdown', 'html', 'htm', 'css', 'less', 'scss', 
    'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'yml', 'yaml', 
    'ini', 'cfg', 'conf', 'sh', 'bash', 'log', 'c', 'cpp', 'h', 
    'java', 'py', 'rb', 'php', 'go', 'rust', 'sql', 'csv'
  ];
  
  // 先检查扩展名
  if (extension && textExtensions.includes(extension.toLowerCase())) {
    return true;
  }
  
  // 再根据文件类型判断
  return fileType === FILE_CATEGORIES.CODE || fileType === FILE_CATEGORIES.DOCUMENT;
}

/**
 * 查询文件信息处理函数
 */
async function getFileWithPermissionCheck(userId: string | null, fileId: string) {
  if (!userId || !fileId) {
    throw new Error('用户ID或文件ID无效');
  }
  
  return await fileManagementService.getFile(userId, fileId);
}

/**
 * 更新文件内容
 */
async function updateFileContent(userId: string, fileId: string, content: string) {
  // 获取文件信息
  const fileInfo = await fileManagementService.getFile(userId, fileId);
  
  if (!fileInfo || fileInfo.isFolder) {
    throw new Error('文件不存在或为文件夹');
  }
  
  // 获取文件路径
  const filename = path.basename(fileInfo.url || '');
  if (!filename) {
    throw new Error('文件路径无效');
  }
  
  const filePath = join(UPLOAD_DIR, filename);
  
  // 检查文件是否存在
  if (!existsSync(filePath)) {
    throw new Error('文件不存在或已被删除');
  }
  
  // 写入文件内容
  writeFileSync(filePath, content, 'utf-8');
  
  // 更新修改时间
  await prisma.file.update({
    where: { id: fileId },
    data: { updatedAt: new Date() }
  });
  
  return fileInfo;
}

/**
 * 获取文件内容处理（GET）
 */
export const GET = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    // 从URL中获取文件ID
    const fileId = req.url.split('/').slice(-2)[0];
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 获取文件信息
    const fileInfo = await getFileWithPermissionCheck(req.user.id, fileId);
    
    if (fileInfo.isFolder) {
      return createApiErrorResponse('不能获取文件夹内容', 400);
    }
    
    // 获取文件路径
    const filename = path.basename(fileInfo.url || '');
    const filePath = join(UPLOAD_DIR, filename);
    
    // 获取文件扩展名
    const fileExtension = path.extname(fileInfo.name).substring(1);
    
    // 判断是否为文本文件
    if (!isTextFile(fileInfo.type, fileExtension)) {
      return createApiErrorResponse('非文本文件，无法获取内容', 400);
    }
    
    // 读取文件内容
    const fileContent = readFileSync(filePath, 'utf-8');
    
    return createApiResponse({ content: fileContent });
  } catch (error: any) {
    console.error('获取文件内容失败:', error);
    return createApiErrorResponse(error.message || '获取文件内容失败', 500);
  }
});

/**
 * 更新文件内容处理（PUT）
 */
export const PUT = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    // 从URL中获取文件ID
    const fileId = req.url.split('/').slice(-2)[0];
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 获取文件信息
    const fileInfo = await getFileWithPermissionCheck(req.user.id, fileId);
    
    if (fileInfo.isFolder) {
      return createApiErrorResponse('不能更新文件夹内容', 400);
    }
    
    // 获取文件扩展名
    const fileExtension = path.extname(fileInfo.name).substring(1);
    
    // 判断是否为文本文件
    if (!isTextFile(fileInfo.type, fileExtension)) {
      return createApiErrorResponse('非文本文件，无法更新内容', 400);
    }
    
    // 获取新的文件内容
    const requestBody = await req.json();
    
    if (!requestBody.content) {
      return createApiErrorResponse('缺少内容参数', 400);
    }
    
    // 使用本地方法更新文件内容
    await updateFileContent(req.user.id, fileId, requestBody.content);
    
    return createApiResponse({ message: '文件内容已更新' });
  } catch (error: any) {
    console.error('更新文件内容失败:', error);
    return createApiErrorResponse(error.message || '更新文件内容失败', 500);
  }
}); 