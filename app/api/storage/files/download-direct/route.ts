/**
 * 直接文件下载API
 * 提供原始文件下载，不进行ZIP打包
 */
import { NextRequest } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { FileInfo } from '@/app/types/domains/fileTypes';
import { prisma } from '@/app/lib/database';
import { AuthenticatedRequest } from '@/app/middleware/auth';
import { withDownloadAuth } from '@/app/middleware/download-auth';
import { promises as fs } from 'fs';
import mime from 'mime-types';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 记录文件下载历史
 */
async function recordDownloadHistory(userId: string, fileId: string) {
  try {
    await prisma.downloadHistory.create({
      data: {
        userId,
        fileId,
        downloadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('记录下载历史失败:', error);
  }
}

/**
 * 处理GET请求下载
 * 使用专门的withDownloadAuth中间件
 */
export const GET = withDownloadAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return new Response(JSON.stringify({ success: false, error: '请提供文件ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const file = await prisma.file.findUnique({
      where: { 
        id: fileId,
        isDeleted: false
      }
    });
    
    if (!file) {
      return new Response(JSON.stringify({ success: false, error: '文件不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (file.isFolder) {
      return new Response(JSON.stringify({ success: false, error: '不能直接下载文件夹，请使用ZIP下载' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 构建文件路径
    const filePath = join(UPLOAD_DIR, file.filename);
    console.log(`直接下载API - 读取文件: ${filePath}`);
    
    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ success: false, error: '文件不存在于磁盘' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 记录下载历史
    await recordDownloadHistory(req.user.id, fileId);
    
    // 确定内容类型
    let contentType = 'application/octet-stream';
    if (file.type && typeof file.type === 'string' && file.type.includes('/')) {
      contentType = file.type;
    } else {
      // 尝试通过文件名确定类型
      const mimeType = mime.lookup(file.name);
      if (mimeType) {
        contentType = mimeType;
      }
    }
    
    // 读取文件
    const fileBuffer = await fs.readFile(filePath);
    const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);
    console.log(`文件已读取，准备返回下载，名称: ${file.name}, 大小: ${fileSizeKB} KB, 类型: ${contentType}`);
    
    // 返回文件响应
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate', 
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('直接下载API出错:', error);
    return new Response(JSON.stringify({ success: false, error: '下载失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 