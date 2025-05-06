import { NextRequest, NextResponse } from 'next/server';
import { stat, createReadStream, existsSync } from 'fs';
import { promisify } from 'util';
import path from 'path';
import { verify } from 'jsonwebtoken';

const statAsync = promisify(stat);

// 扩展支持的MIME类型映射
const mimeTypes: Record<string, string> = {
  // 图片
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'bmp': 'image/bmp',
  'ico': 'image/x-icon',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  // 视频
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'ogv': 'video/ogg',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  // 音频
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'm4a': 'audio/mp4',
  // 文档
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本
  'txt': 'text/plain',
  'csv': 'text/csv',
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'md': 'text/markdown',
  // 压缩
  'zip': 'application/zip',
  'rar': 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  // 其他
  'bin': 'application/octet-stream',
  'exe': 'application/octet-stream',
  'dll': 'application/octet-stream',
  'so': 'application/octet-stream',
  'swf': 'application/x-shockwave-flash',
};

// 根据文件名获取MIME类型
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
};

// 检查是否是Office文档或PDF
const isDocumentType = (mimeType: string): boolean => {
  return mimeType.includes('pdf') || 
         mimeType.includes('msword') || 
         mimeType.includes('officedocument') || 
         mimeType.includes('ms-excel') || 
         mimeType.includes('ms-powerpoint') ||
         mimeType.includes('spreadsheetml') ||
         mimeType.includes('text/csv');
};

/**
 * GET /api/storage/files/serve
 * 
 * 提供文件内容的API端点
 * 使用token进行授权访问
 */
export async function GET(request: NextRequest) {
  try {
    console.log('接收到文件服务请求');
    
    // 从URL获取令牌
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('缺少访问令牌');
      return NextResponse.json(
        { error: '缺少访问令牌' },
        { status: 401 }
      );
    }
    
    // 解析令牌
    const secret = process.env.JWT_SECRET || 'archimedes-cloud-drive-secure-file-access';
    let payload;
    
    try {
      // 验证并解析JWT
      payload = verify(token, secret) as { id: string, path: string };
    } catch (error) {
      console.error('令牌验证失败:', error);
      return NextResponse.json(
        { error: '无效或已过期的访问令牌' },
        { status: 401 }
      );
    }
    
    if (!payload.path) {
      console.log('令牌缺少文件路径');
      return NextResponse.json(
        { error: '令牌缺少必要的文件路径信息' },
        { status: 400 }
      );
    }
    
    // 获取文件路径
    const filePath = payload.path;
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return NextResponse.json(
        { error: '文件不存在或无法访问' },
        { status: 404 }
      );
    }
    
    // 获取文件信息
    const stats = await statAsync(filePath);
    if (!stats.isFile()) {
      console.error('请求的不是文件:', filePath);
      return NextResponse.json(
        { error: '请求的路径不是文件' },
        { status: 400 }
      );
    }
    
    // 获取文件MIME类型
    const mimeType = getMimeType(filePath);
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', stats.size.toString());
    
    // 对于文档类型，设置合适的Content-Disposition
    if (isDocumentType(mimeType)) {
      // 使用inline，允许浏览器尝试在线预览
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(filePath))}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(filePath))}"`);
    }
    
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    console.log('提供文件:', {
      id: payload.id,
      path: filePath,
      mimeType,
      size: stats.size
    });
    
    // 创建文件流
    const fileStream = createReadStream(filePath);
    
    // 返回文件流
    return new NextResponse(fileStream as any, {
      headers
    });
  } catch (error) {
    console.error('服务文件时出错:', error);
    return NextResponse.json(
      { error: '无法提供请求的文件', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 