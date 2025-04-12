/**
 * 文件下载API路由
 * 处理文件下载请求
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

const storageService = new StorageService();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 文件下载处理
 */
export const POST = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 如果只下载一个文件，直接返回文件内容
    if (fileIds.length === 1) {
      const fileId = fileIds[0];
      const fileInfo = await storageService.getFile(req.user.id, fileId);
      
      if (fileInfo.isFolder) {
        return createApiErrorResponse('不能直接下载文件夹', 400);
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
      
      // 设置下载头
      return new NextResponse(fileContent, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.name)}"`,
          'Content-Type': 'application/octet-stream',
        },
      });
    } 
    
    // 如果下载多个文件，需要创建一个ZIP文件
    // 这里简化处理，实际实现需要使用JSZip或其他库进行压缩
    return createApiErrorResponse('批量下载功能正在开发中', 501);
  } catch (error: any) {
    console.error('下载文件失败:', error);
    return createApiErrorResponse(error.message || '下载文件失败', 500);
  }
}); 