/**
 * 文件下载测试API端点
 * 用于检查文件存储和下载功能
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileManagementService } from '@/app/services/storage';
import { NextResponse } from 'next/server';
import { existsSync, readdirSync } from 'fs';
import fs from 'fs/promises';
import { join } from 'path';

const fileManagementService = new FileManagementService();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 文件下载测试API
 */
export const GET = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求参数
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');
    const action = url.searchParams.get('action') || 'info';
    
    // 如果没有提供文件ID，返回上传目录信息
    if (!fileId && action === 'info') {
      // 检查上传目录是否存在
      const uploadDirExists = existsSync(UPLOAD_DIR);
      
      // 如果上传目录存在，获取目录内容
      let files: string[] = [];
      if (uploadDirExists) {
        try {
          files = readdirSync(UPLOAD_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name)
            .slice(0, 20); // 最多显示20个文件
        } catch (err) {
          console.error('读取上传目录失败:', err);
        }
      }
      
      return createApiResponse({
        status: 'success',
        uploadDir: UPLOAD_DIR,
        uploadDirExists,
        filesCount: files.length,
        files
      });
    }
    
    // 如果提供了文件ID，获取文件信息
    if (fileId) {
      const fileInfo = await fileManagementService.getFile(req.user.id, fileId);
      
      if (!fileInfo) {
        return createApiErrorResponse(`文件不存在: ${fileId}`, 404);
      }
      
      // 诊断信息
      const diagnostics = {
        fileId: fileInfo.id,
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
        filename: fileInfo.filename,
        url: fileInfo.url,
        path: fileInfo.path,
        pathExists: false,
        filenameExists: false,
        idFileExists: false,
        lastSegmentExists: false
      };
      
      // 检查各种文件路径是否存在
      if (fileInfo.filename) {
        const filenameExists = existsSync(join(UPLOAD_DIR, fileInfo.filename));
        diagnostics.filenameExists = filenameExists;
      }
      
      // 检查ID作为文件名是否存在
      diagnostics.idFileExists = existsSync(join(UPLOAD_DIR, fileInfo.id));
      
      // 检查URL最后一段是否存在
      if (fileInfo.url) {
        const urlParts = fileInfo.url.split('/');
        const lastSegment = urlParts[urlParts.length - 1];
        if (lastSegment) {
          diagnostics.lastSegmentExists = existsSync(join(UPLOAD_DIR, lastSegment));
        }
      }
      
      if (action === 'info') {
        return createApiResponse({
          status: 'success',
          fileInfo,
          diagnostics
        });
      }
      
      // 如果动作是download，下载文件
      if (action === 'download') {
        let filePath = null;
        
        // 尝试找到文件的路径
        if (fileInfo.filename && diagnostics.filenameExists) {
          filePath = join(UPLOAD_DIR, fileInfo.filename);
        } else if (diagnostics.idFileExists) {
          filePath = join(UPLOAD_DIR, fileInfo.id);
        } else if (fileInfo.url && diagnostics.lastSegmentExists) {
          const urlParts = fileInfo.url.split('/');
          filePath = join(UPLOAD_DIR, urlParts[urlParts.length - 1]);
        }
        
        if (!filePath || !existsSync(filePath)) {
          return createApiErrorResponse('文件不存在或无法访问', 404);
        }
        
        // 读取文件内容
        const fileContent = await fs.readFile(filePath);
        
        // 返回文件内容
        return new NextResponse(fileContent, {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.name)}"`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileContent.length.toString()
          }
        });
      }
    }
    
    return createApiErrorResponse('无效的请求', 400);
  } catch (error: any) {
    console.error('文件下载测试失败:', error);
    return createApiErrorResponse(error.message || '测试失败', 500);
  }
}); 