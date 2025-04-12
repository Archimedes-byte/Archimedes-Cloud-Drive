/**
 * 文件预览API路由
 * 处理文件预览请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { FILE_CATEGORIES } from '@/app/utils/file-utils';

const storageService = new StorageService();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 获取文件MIME类型
 */
function getMimeType(fileCategory: string, extension: string): string {
  // 常见MIME类型映射
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
  };
  
  // 先根据扩展名判断
  if (extension && mimeMap[extension.toLowerCase()]) {
    return mimeMap[extension.toLowerCase()];
  }
  
  // 根据类别返回通用MIME类型
  switch (fileCategory) {
    case FILE_CATEGORIES.IMAGE:
      return 'image/jpeg';
    case FILE_CATEGORIES.VIDEO:
      return 'video/mp4';
    case FILE_CATEGORIES.AUDIO:
      return 'audio/mpeg';
    case FILE_CATEGORIES.DOCUMENT:
      return 'application/pdf';
    case FILE_CATEGORIES.CODE:
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 文件预览处理
 */
export const GET = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    // 从URL中获取文件ID
    const fileId = req.url.split('/').slice(-2)[0];
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 获取文件信息
    const fileInfo = await storageService.getFile(req.user.id, fileId);
    
    if (fileInfo.isFolder) {
      return createApiErrorResponse('不能预览文件夹', 400);
    }
    
    // 获取文件路径
    const filename = path.basename(fileInfo.url || '');
    const filePath = join(UPLOAD_DIR, filename);
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return createApiErrorResponse('文件不存在', 404);
    }
    
    // 读取文件内容
    const fileContent = readFileSync(filePath);
    const fileExtension = path.extname(fileInfo.name).substring(1);
    
    // 根据文件类型设置相应的内容类型
    const contentType = getMimeType(fileInfo.type, fileExtension);
    
    // 判断是下载还是预览
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';
    
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    
    // 如果是下载，设置下载头
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(fileInfo.name)}"`;
    } 
    // 对于图片、PDF等，可以直接在浏览器中预览
    else if (
      fileInfo.type === FILE_CATEGORIES.IMAGE || 
      fileExtension === 'pdf'
    ) {
      headers['Content-Disposition'] = 'inline';
    } 
    // 其他文件类型，提供内联显示但让浏览器决定如何处理
    else {
      headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(fileInfo.name)}"`;
    }
    
    return new NextResponse(fileContent, { headers });
  } catch (error: any) {
    console.error('预览文件失败:', error);
    return createApiErrorResponse(error.message || '预览文件失败', 500);
  }
}); 